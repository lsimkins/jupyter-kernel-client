import zmq, { Socket } from 'zeromq';
import { KernelRuntimeConfig } from './kernel-runtime-config';
import { IOPubChannel, ShellChannel } from './channel';
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

export default class KernelClient {
  private iopubSock?: ZmqSocket;
  private shellSock?: ZmqSocket;
  private iopubChannel?: IOPubChannel;
  private shellChannel?: ShellChannel;
  session: Session;

  constructor(private runtimeConfig: KernelRuntimeConfig) {
    this.session = new Session(this.runtimeConfig);
  }

  get iopub(): IOPubChannel {
    if (!this.iopubChannel) {
      this.iopubChannel = new IOPubChannel({
        ip: this.runtimeConfig.ip,
        port: this.runtimeConfig.iopubPort,
        session: this.session
      });
      this.iopubChannel.socket.subscribe();
    }

    return this.iopubChannel;
  }

  get shell(): ShellChannel {
    if (!this.shellChannel) {
      this.shellChannel = new ShellChannel({
        ip: this.runtimeConfig.ip,
        port: this.runtimeConfig.shellPort,
        session: this.session
      });
    }

    return this.shellChannel;
  }

  executeCode(code: string, userExpressions: any = {}, silent: boolean = true) {
    const msg = this.session.createMsg('execute_request', {code, user_expressions: userExpressions, silent});

    this.shell.socket.send(msg);

    this.shell.socket.receive().then(res => {
      const result = this.session.unpack(...res);

      console.debug(result);
      console.debug((result.content as any).user_expressions);
    });
  }

  get stdinAddress(): string {
    const { transport, ip, stdinPort } = this.runtimeConfig;

    return `${transport}://${ip}:${stdinPort}`;
  }

  connect() {
    this.iopub.connect();
    this.shell.connect();
  }

  disconnect() {
    this.iopub.disconnect();
    this.shell.disconnect();
  }
}
