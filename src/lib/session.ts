import { v4 as uuid4 } from 'uuid';
import os from 'os';
import { KernelMessage, MsgHeader, UnsignedKernelMessage } from '@lib/kernel-message';
import crypto from 'crypto';

export type SessionConfig = {
  sessionId?: string;
  username?: string;
  key: string;
  signatureScheme: string;
};

export default class Session {
  readonly sessionId: string;
  readonly username: string;
  readonly key: string;
  readonly hmacAlg: string;

  private msgCount: number;

  constructor(config: SessionConfig) {
    this.sessionId = config.sessionId || uuid4();
    this.username = config.username || os.userInfo().username;
    this.key = config.key;
    this.msgCount = 0;

    const [_, alg] = config.signatureScheme.split('hmac-');

    if (!alg) {
      throw `Unknown signature scheme: ${config.signatureScheme}. Scheme must be in format "hmac-[algorithm]. E.g. "hmac-sha256"`;
    }

    this.hmacAlg = alg;
  }

  createMsgId() {
    return `${this.sessionId}_${++this.msgCount}`;
  }

  createMsg<ContentType={}>(msgType: string, content: ContentType, parentHeader: MsgHeader | {} = {}) {
    const msgId = this.createMsgId();
    const delimiter = KernelMessage.standardDelimiter;
    const header = KernelMessage.createHeader(msgId, msgType, this.username, this.sessionId);

    console.debug({
      identity: `client.${this.sessionId}.${msgType}`,
      delimiter,
      header,
      parent_header: parentHeader,
      metadata: {},
      content
    });

    return this.pack({
      identity: `client.${this.sessionId}.${msgType}`,
      delimiter,
      header,
      parent_header: parentHeader,
      metadata: {},
      content
    });
  }

  sign<ContentType={}>(msg: UnsignedKernelMessage<ContentType>): string {
    const hash = crypto.createHmac(this.hmacAlg, this.key);

    [msg.header, msg.parent_header, msg.metadata, msg.content].forEach(
      p => hash.update(JSON.stringify(p))
    );

    return hash.digest('hex');
  }

  pack<ContentType={}>(msg: UnsignedKernelMessage<ContentType>): Buffer[] {
    return [
      msg.identity,
      msg.delimiter,
      this.sign(msg),
      JSON.stringify(msg.header),
      JSON.stringify(msg.parent_header),
      JSON.stringify(msg.metadata),
      JSON.stringify(msg.content),
    ].map(part => Buffer.from(part, 'utf-8'));
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

  static create(config: SessionConfig) {
    return new Session(config);
  }
}