import zmq, { Socket } from 'zeromq';
import { assign } from 'lodash';
import Session, { KernelMessage } from './session';

interface ZmqSocket extends Socket {
  closed: boolean;
}

type ZmqSocketType =
  'pub' |
  'xpub' |
  'sub' |
  'xsub' |
  'req' |
  'xreq' |
  'rep' |
  'xrep' |
  'push' |
  'pull' |
  'dealer' |
  'router' |
  'pair' |
  'stream'

export type ChannelConfig = {
  type: ZmqSocketType,
  ip: string,
  port: number,
  session: Session
};

export class Channel {
  private transport = 'tcp';
  private zmqSocket?: ZmqSocket;
  private type: ZmqSocketType;
  private ip: string;
  private port: number;
  session: Session;

  constructor(config: ChannelConfig) {
    this.type = config.type;
    this.ip = config.ip;
    this.port = config.port;
    this.session = config.session;
  }

  get address() {
    return `${this.transport}://${this.ip}:${this.port}`;
  }

  get socket() {
    if (!this.zmqSocket) {
      this.zmqSocket = zmq.socket(this.type) as ZmqSocket;
    }

    return this.zmqSocket;
  }

  connect() {
    this.socket.connect(this.address);
  }

  disconnect() {
    if (this.zmqSocket) {
      this.zmqSocket.disconnect(this.address);
    }
  }
}

export interface IOPubChannelConfig {
  ip: string;
  port: number;
  session: Session;
  filter?: string;
};

const defaultIOPubChannelConfig = {
  filter: ''
};

type IOPubChannelCallback = (msg: KernelMessage<{}>) => void;


export class IOPubChannel extends Channel {
  private listenerMap: Map<IOPubChannelCallback,  (...args: any[]) => void> = new Map();

  constructor(config: IOPubChannelConfig) {
    super({
      ...defaultIOPubChannelConfig,
      ...config,
      type: 'sub'
    });
  }

  listen(cb: (msg: KernelMessage<{}>) => void) {
    this.socket.subscribe('');
    const unpackedCb = (...msgs: Buffer[]) => {
      console.debug('I was called');
      const msg = this.session.unpack(...msgs);
      cb(msg);
    };
    this.socket.on('message', unpackedCb);

    this.listenerMap.set(cb, unpackedCb);
  }

  unlisten(cb: (msg: KernelMessage<{}>) => void) {
    const unpackedCb = this.listenerMap.get(cb);

    if (unpackedCb) {
      this.socket.off('message', unpackedCb);
      this.listenerMap.delete(unpackedCb);
    }
  }
}