import { v4 as uuid4 } from 'uuid';
import os from 'os';

export type MsgHeader = {
  msg_id: string;
  username: string;
  date: string;
  msg_type: string;
  version: string;
}

export type KernelMsg<Content={}> = {
  identity: string;
  delimiterKey: string;
  signature: string;
  header: MsgHeader;
  parent_header: MsgHeader;
  metadata: {};
  content: Content;
};

export type SessionConfig = {
  sessionId?: string;
  username?: string;
  key: string;
}


export default class Session {
  private sessionId: string;
  private username: string;
  private key: string;

  constructor(config: SessionConfig) {
    this.sessionId = config.sessionId || uuid4();
    this.username = config.username || os.userInfo().username;
    this.key = config.key;
  }

  
}