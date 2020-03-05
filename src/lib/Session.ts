import { v4 as uuid4 } from 'uuid';
import os from 'os';

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
  parent_header: MsgHeader;
  metadata: {};
}

export interface KernelMessage<Content={}> extends KernelBaseMessage {
  content: Content;
};

export type SessionConfig = {
  sessionId?: string;
  username?: string;
  key: string;
}

export const KernelMessage = {
  standardDelimiter: "<IDS|MSG>",
  createHeader: function(msgId: string, msgType: string, username: string, session: string) {
    return {
      msg_id: msgId,
      username,
      msg_type: msgType,
      session,
      date: new Date().toISOString(),

    }
  }
};

export default class Session {
  private sessionId: string;
  private username: string;
  private key: string;
  private msgCount: number;

  constructor(config: SessionConfig) {
    this.sessionId = config.sessionId || uuid4();
    this.username = config.username || os.userInfo().username;
    this.key = config.key;
    this.msgCount = 0;
  }

  createMsgId() {
    return `${this.sessionId}_${++this.msgCount}`;
  }

  unpack<ContentType={}>(...msgs: Buffer[]): KernelMessage<ContentType> {
    const messages = msgs.map(msg => msg.toString('utf-8'));
    const [identity, delimiter, signature, header, parent_header, metadata, content] = messages;
    return {
      identity,
      delimiter,
      signature,
      header: JSON.parse(header),
      parent_header: JSON.parse(parent_header),
      metadata: JSON.parse(metadata),
      content: JSON.parse(content)
    };
  }
}