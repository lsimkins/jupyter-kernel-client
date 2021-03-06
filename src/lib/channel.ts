import * as zmq from 'zeromq';
import Session from './session';
import { KernelMessage } from './kernel-message';


export type ChannelConfig = {
  ip: string,
  port: number,
  session: Session
};

export class Channel<S extends zmq.Socket> {
  private transport = 'tcp';
  private sock: S;
  private ip: string;
  private port: number;
  session: Session;

  constructor(config: ChannelConfig, socket: S) {
    this.sock = socket;
    this.ip = config.ip;
    this.port = config.port;
    this.session = config.session;
  }

  get address() {
    return `${this.transport}://${this.ip}:${this.port}`;
  }

  get socket() {
    return this.sock;
  }

  connect() {
    return this.sock.connect(this.address);
  }

  disconnect() {
    return this.sock.disconnect(this.address);
  }

  bind(): Promise<void> {
    return this.sock.bind(this.address);
  }

  unbind(): Promise<void> {
    return this.sock.unbind(this.address);
  }
}

type IOPubChannelCallback = (msg: KernelMessage<{}>) => void;


export class IOPubChannel extends Channel<zmq.Subscriber> {
  constructor(config: ChannelConfig) {
    super({...config}, new zmq.Subscriber);
  }

  async* [Symbol.asyncIterator](): AsyncIterator<KernelMessage> {
    for await (const msg of this.socket) {
      yield this.session.unpack(...msg);
    }
  }
}

export class ShellChannel extends Channel<zmq.Dealer> {
  constructor(config: Omit<ChannelConfig, 'socket'>) {
    super({ ...config }, new zmq.Dealer);
  }
}