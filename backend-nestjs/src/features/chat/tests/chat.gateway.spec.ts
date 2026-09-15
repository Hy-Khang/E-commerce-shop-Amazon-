import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatGateway } from '../chat.gateway';
import { ChatService } from '../chat.service';
import { CHAT_EVENTS, MessageStatus } from '../types/chat.types';

/** Minimal fake socket.io Socket with the members the gateway touches. */
function makeSocket(id: string, token: string) {
  return {
    id,
    handshake: { auth: { token }, headers: {} },
    data: {} as { userId?: number },
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
  };
}

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let jwtService: jest.Mocked<JwtService>;
  let chatService: jest.Mocked<ChatService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: JwtService, useValue: { verify: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: ChatService, useValue: { assertParticipant: jest.fn() } },
      ],
    }).compile();

    gateway = module.get(ChatGateway);
    jwtService = module.get(JwtService);
    chatService = module.get(ChatService);
  });

  describe('presence → delivery status', () => {
    const RECIPIENT = 9;
    const CONV = 1;

    it('is "sent" when the recipient is offline', () => {
      expect(gateway.resolveDeliveryStatus(RECIPIENT, CONV)).toBe(
        MessageStatus.Sent,
      );
    });

    it('is "delivered" once the recipient connects (online, not in room)', () => {
      jwtService.verify.mockReturnValue({ sub: RECIPIENT });
      const socket = makeSocket('s1', 'tok');
      gateway.handleConnection(socket as never);

      expect(gateway.resolveDeliveryStatus(RECIPIENT, CONV)).toBe(
        MessageStatus.Delivered,
      );
    });

    it('is "read" once the recipient joins the conversation room', async () => {
      jwtService.verify.mockReturnValue({ sub: RECIPIENT });
      chatService.assertParticipant.mockResolvedValue({} as never);
      const socket = makeSocket('s1', 'tok');
      gateway.handleConnection(socket as never);
      await gateway.handleJoin(socket as never, { conversationId: CONV });

      expect(gateway.resolveDeliveryStatus(RECIPIENT, CONV)).toBe(
        MessageStatus.Read,
      );
    });

    it('falls back to "sent" after the recipient disconnects', async () => {
      jwtService.verify.mockReturnValue({ sub: RECIPIENT });
      chatService.assertParticipant.mockResolvedValue({} as never);
      const socket = makeSocket('s1', 'tok');
      gateway.handleConnection(socket as never);
      await gateway.handleJoin(socket as never, { conversationId: CONV });

      gateway.handleDisconnect(socket as never);

      expect(gateway.resolveDeliveryStatus(RECIPIENT, CONV)).toBe(
        MessageStatus.Sent,
      );
    });

    it('stays online across multiple tabs until the last disconnects', () => {
      jwtService.verify.mockReturnValue({ sub: RECIPIENT });
      const tab1 = makeSocket('s1', 'tok');
      const tab2 = makeSocket('s2', 'tok');
      gateway.handleConnection(tab1 as never);
      gateway.handleConnection(tab2 as never);

      gateway.handleDisconnect(tab1 as never);
      expect(gateway.resolveDeliveryStatus(RECIPIENT, CONV)).toBe(
        MessageStatus.Delivered,
      );

      gateway.handleDisconnect(tab2 as never);
      expect(gateway.resolveDeliveryStatus(RECIPIENT, CONV)).toBe(
        MessageStatus.Sent,
      );
    });

    it('rejects a join the caller is not a participant of (no presence)', async () => {
      jwtService.verify.mockReturnValue({ sub: 999 });
      chatService.assertParticipant.mockRejectedValue(new Error('CHAT_002'));
      const socket = makeSocket('s1', 'tok');
      gateway.handleConnection(socket as never);
      await gateway.handleJoin(socket as never, { conversationId: CONV });

      // Online but never actually joined the room → delivered, not read.
      expect(gateway.resolveDeliveryStatus(999, CONV)).toBe(
        MessageStatus.Delivered,
      );
    });
  });

  describe('emitRead', () => {
    it('targets only the counterpart user room, never the conversation room', () => {
      const emit = jest.fn();
      const to = jest.fn().mockReturnValue({ emit });
      (gateway as unknown as { server: unknown }).server = { to };

      gateway.emitRead(1, 9, MessageStatus.Read);

      expect(to).toHaveBeenCalledWith('user:9');
      expect(to).not.toHaveBeenCalledWith('conversation:1');
      expect(emit).toHaveBeenCalledWith(CHAT_EVENTS.Read, {
        conversationId: 1,
        status: MessageStatus.Read,
      });
    });
  });
});
