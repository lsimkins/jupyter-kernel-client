import { v4 as uuid4 } from 'uuid';
import os from 'os';
import { KernelMessage } from '@lib/kernel-message';

export type SessionConfig = {
  sessionId?: string;
  username?: string;
  key: string;
}

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

  pack<ContentType={}>(msg: KernelMessage<ContentType>): Buffer[] {
    return [
      msg.identity,
      msg.delimiter,
      msg.signature,
      JSON.stringify(msg.header),
      JSON.stringify(msg.parent_header),
      JSON.stringify(msg.metadata),
      JSON.stringify(msg.content)
    ].map(part => new Buffer(part, 'utf-8'));
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