export enum SenderType {
  Customer = 'customer',
  Seller = 'seller',
}

export enum MessageStatus {
  Sent = 'sent',
  Delivered = 'delivered',
  Read = 'read',
}

/** The caller's role relative to a conversation, resolved server-side. */
export interface IConversationParticipant {
  /** 'customer' if caller is the buyer, 'seller' if caller owns the shop. */
  side: SenderType;
  /** The user id on the other side of the conversation (the recipient). */
  recipientUserId: number;
}

/** Socket event names — client and server share this contract. */
export const CHAT_EVENTS = {
  NewMessage: 'chat:new_message',
  Read: 'chat:read',
  Typing: 'chat:typing',
  Presence: 'chat:presence',
  Join: 'chat:join',
  Leave: 'chat:leave',
} as const;
