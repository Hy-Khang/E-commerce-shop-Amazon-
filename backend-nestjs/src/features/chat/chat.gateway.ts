import { forwardRef, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { MessageResponseDto } from './dto/chat-response.dto';
import { CHAT_EVENTS, MessageStatus } from './types/chat.types';

function conversationRoom(id: number): string {
  return `conversation:${id}`;
}

/**
 * Chat realtime gateway. Shares the default namespace `/` with
 * NotificationGateway (one shared client socket), but does its **own** JWT
 * verification in handleConnection rather than depending on the other gateway
 * having run first (both fire per socket — ordering would be a race).
 */
@WebSocketGateway({
  cors: {
    origin: (
      origin: string,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      callback(null, true);
    },
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  // userId → number of live sockets (multi-tab safe).
  private readonly onlineCount = new Map<number, number>();
  // socketId → conversation ids this socket has joined.
  private readonly socketConversations = new Map<string, Set<number>>();
  // conversationId → (userId → number of that user's sockets in the room).
  private readonly conversationUsers = new Map<number, Map<number, number>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
  ) {}

  handleConnection(client: Socket): void {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<{ sub: number }>(token, {
        secret: this.configService.get<string>('jwt.accessSecret'),
      });

      const userId = payload.sub;
      (client.data as { userId?: number }).userId = userId;
      void client.join(`user:${userId}`);
      this.onlineCount.set(userId, (this.onlineCount.get(userId) ?? 0) + 1);
      this.socketConversations.set(client.id, new Set());
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = (client.data as { userId?: number })?.userId;
    const joined = this.socketConversations.get(client.id);

    if (userId != null && joined) {
      for (const conversationId of joined) {
        this.leaveConversationRoom(client, conversationId, userId, false);
      }
    }
    this.socketConversations.delete(client.id);

    if (userId != null) {
      const remaining = (this.onlineCount.get(userId) ?? 1) - 1;
      if (remaining <= 0) this.onlineCount.delete(userId);
      else this.onlineCount.set(userId, remaining);
    }
  }

  @SubscribeMessage(CHAT_EVENTS.Join)
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: number },
  ): Promise<void> {
    const userId = (client.data as { userId?: number })?.userId;
    const conversationId = Number(body?.conversationId);
    if (userId == null || !Number.isInteger(conversationId)) return;

    // Membership check — never let a socket join a room it isn't part of.
    try {
      await this.chatService.assertParticipant(userId, conversationId);
    } catch {
      return;
    }

    void client.join(conversationRoom(conversationId));
    this.socketConversations.get(client.id)?.add(conversationId);

    const users =
      this.conversationUsers.get(conversationId) ?? new Map<number, number>();
    users.set(userId, (users.get(userId) ?? 0) + 1);
    this.conversationUsers.set(conversationId, users);

    // Tell the room this user is now present.
    client
      .to(conversationRoom(conversationId))
      .emit(CHAT_EVENTS.Presence, { conversationId, userId, online: true });

    // Reply to the joiner with whoever is already present (excluding self).
    for (const otherUserId of users.keys()) {
      if (otherUserId !== userId) {
        client.emit(CHAT_EVENTS.Presence, {
          conversationId,
          userId: otherUserId,
          online: true,
        });
      }
    }
  }

  @SubscribeMessage(CHAT_EVENTS.Leave)
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: number },
  ): void {
    const userId = (client.data as { userId?: number })?.userId;
    const conversationId = Number(body?.conversationId);
    if (userId == null || !Number.isInteger(conversationId)) return;
    this.socketConversations.get(client.id)?.delete(conversationId);
    this.leaveConversationRoom(client, conversationId, userId, true);
  }

  @SubscribeMessage(CHAT_EVENTS.Typing)
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: number; isTyping: boolean },
  ): void {
    const userId = (client.data as { userId?: number })?.userId;
    const conversationId = Number(body?.conversationId);
    if (userId == null || !Number.isInteger(conversationId)) return;
    client.to(conversationRoom(conversationId)).emit(CHAT_EVENTS.Typing, {
      conversationId,
      userId,
      isTyping: !!body?.isTyping,
    });
  }

  // ─── Server-side helpers (called by ChatService) ───

  /**
   * Resolve the initial delivery status for a message based on the recipient's
   * live presence: viewing the thread ⇒ read; merely online ⇒ delivered; else
   * sent.
   */
  resolveDeliveryStatus(
    recipientUserId: number,
    conversationId: number,
  ): MessageStatus {
    const inRoom = this.conversationUsers
      .get(conversationId)
      ?.has(recipientUserId);
    if (inRoom) return MessageStatus.Read;
    if ((this.onlineCount.get(recipientUserId) ?? 0) > 0) {
      return MessageStatus.Delivered;
    }
    return MessageStatus.Sent;
  }

  /** Emit a new message to the conversation room and the recipient's user room. */
  emitNewMessage(
    conversationId: number,
    recipientUserId: number,
    message: MessageResponseDto,
  ): void {
    this.server
      .to(conversationRoom(conversationId))
      .emit(CHAT_EVENTS.NewMessage, message);
    // Also notify the recipient's personal room so their badge updates even
    // when they don't have the thread open.
    this.server
      .to(`user:${recipientUserId}`)
      .emit(CHAT_EVENTS.NewMessage, message);
  }

  /**
   * Emit a read-receipt update to the **counterpart only** (the original sender
   * whose messages were just read) — via their personal `user:{id}` room so it
   * reaches every tab whether or not they have the thread open. It deliberately
   * does NOT broadcast to the conversation room: the reader must not receive
   * their own read event, or their own still-unseen bubbles would flip to read.
   */
  emitRead(
    conversationId: number,
    counterpartUserId: number,
    status: MessageStatus,
  ): void {
    this.server
      .to(`user:${counterpartUserId}`)
      .emit(CHAT_EVENTS.Read, { conversationId, status });
  }

  private leaveConversationRoom(
    client: Socket,
    conversationId: number,
    userId: number,
    doLeave: boolean,
  ): void {
    if (doLeave) void client.leave(conversationRoom(conversationId));

    const users = this.conversationUsers.get(conversationId);
    if (!users) return;

    const count = (users.get(userId) ?? 1) - 1;
    if (count <= 0) {
      users.delete(userId);
      // This user has no more sockets in the room → announce offline.
      client
        .to(conversationRoom(conversationId))
        .emit(CHAT_EVENTS.Presence, { conversationId, userId, online: false });
    } else {
      users.set(userId, count);
    }
    if (users.size === 0) this.conversationUsers.delete(conversationId);
  }
}
