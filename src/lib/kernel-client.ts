import zmq, { Socket } from 'zeromq';
import { KernelRuntimeConfig } from './kernel-runtime-config';
import { IOPubChannel } from './channel';
import Session from './session';

interface ZmqSocket extends Socket {
  closed: boolean;
}

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

export default class KernelClient {
  private iopubSock?: ZmqSocket;
  private shellSock?: ZmqSocket;
  private iopubChannel?: IOPubChannel;
  session: Session;

  constructor(private runtimeConfig: KernelRuntimeConfig) {
    this.session = new Session({ key: this.runtimeConfig.key });
  }

  get iopub(): IOPubChannel {
    if (!this.iopubChannel) {
      this.iopubChannel = new IOPubChannel({
        ip: this.runtimeConfig.ip,
        port: this.runtimeConfig.iopubPort,
        session: this.session
      });
    }

    return this.iopubChannel;
  }

  get ippubSocket(): ZmqSocket {
    if (!this.iopubSock) {
      this.iopubSock = zmq.socket('sub') as ZmqSocket;
    }

    return this.iopubSock;
  }

  get shellSocket(): ZmqSocket {
    if (!this.shellSock) {
      this.shellSock = zmq.socket('dealer') as ZmqSocket;
    }

    return this.shellSock;
  }

  get iopubAddress(): string {
    const { transport, ip, iopubPort } = this.runtimeConfig;

    return `${transport}://${ip}:${iopubPort}`;
  }

  get hbAddress(): string {
    const { transport, ip, hbPort } = this.runtimeConfig;

    return `${transport}://${ip}:${hbPort}`;
  }

  get stdinAddress(): string {
    const { transport, ip, stdinPort } = this.runtimeConfig;

    return `${transport}://${ip}:${stdinPort}`;
  }

  executeRequest() {
    this.shellSocket.send(Buffer.from(JSON.stringify({
      code: 'print(1)',
      silent: true
    })));
    console.info(`Sent execute request`);

    this.shellSocket.on('message', console.debug);
  }

  connect() {
    this.ippubSocket.connect(this.iopubAddress);
    this.ippubSocket.subscribe('');
    console.info(`Client successfully bound to ${this.iopubAddress}`);

    this.ippubSocket.on("message", decode(console.debug));
  }

  disconnect() {
    if (!this.ippubSocket.closed) {
      this.ippubSocket.close();
    }

    if (!this.shellSocket.closed) {
      this.shellSocket.close();
    }
  }
}

function decode<ContentType={}>(cb: (args: KernelMsg<ContentType>) => any) {
  return (...msgs: Buffer[]) => {
    const messages = msgs.map(msg => msg.toString('utf-8'));
    const [identity, delimiterKey, signature, header, parent_header, metadata, content] = messages;
    cb({
      identity,
      delimiterKey,
      signature,
      header: JSON.parse(header),
      parent_header: JSON.parse(parent_header),
      metadata: JSON.parse(metadata),
      content: JSON.parse(content)
    });
  }
}