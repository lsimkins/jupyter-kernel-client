import { protocolVersion } from '@lib/protocol-version';

export type MsgHeader = {
  msg_id: string;
  username: string;
  date: string;
  msg_type: string;
  version: string;
  session: string;
}

export interface KernelBaseMessage {
  identity: string;
  delimiter: string;
  signature: string;
  header: MsgHeader;
  parent_header: MsgHeader | {};
  metadata: {};
}

export interface KernelMessage<Content={}> extends KernelBaseMessage {
  content: Content;
};

export type UnsignedKernelMessage<Content={}> = Omit<KernelMessage<Content>, 'signature'>;

export const KernelMessage = {
  standardDelimiter: "<IDS|MSG>",
  createHeader: function(msgId: string, msgType: string, username: string, sessionId: string): MsgHeader {
    const session = sessionId;
    return {
      msg_id: msgId,
      username,
      msg_type: msgType,
      session,
      date: new Date().toISOString(),
      version: protocolVersion
    };
  }
};