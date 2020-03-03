import request, { RequestPromise } from 'request-promise-native';
import url from 'url';
import WebSocket from 'ws';
import { KernelRuntimeConfig } from './KernelRuntimeConfig';
import fs from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

export type KernelModel = {
  id: string;
  name: string;
  lastActivity: string;
  executionState: 'busy' | 'idle' | 'starting';
  connections: number;
};

export type KernelAPIError = {
  message: string | null;
  reason: string | null;
};

export type KernelManagerConfig = {
  juptyerUrl: string;
  kernelConnPath: string;
  token?: string;
};

export default class KernelManager {
  private kernelApiPath = '/api/kernels'
  private host: string | null;

  constructor(private config: KernelManagerConfig) {
    this.host = url.parse(config.juptyerUrl).host;
  }

  listKernels(): RequestPromise<KernelModel[]> {
    return this.get(this.kernelsUrl);
  }

  getKernel(kernelId: string): RequestPromise<KernelModel> {
    return this.get(this.kernelIdUrl(kernelId));
  }

  startKernel(specName: string): RequestPromise<KernelModel> {
    return this.post(
      this.kernelsUrl,
      { name: specName }
    );
  }

  restartKernel(kernelId: string): RequestPromise<any> {
    return this.post(`${this.kernelIdUrl(kernelId)}/restart`);
  }

  interruptKernel(kernelId: string): RequestPromise<undefined | KernelAPIError> {
    return this.post(`${this.kernelIdUrl(kernelId)}/interrupt`);
  }

  openWebsocketChannel(kernelId: string): WebSocket {
    return new WebSocket(`ws://${this.host}/api/kernels/${kernelId}/channels?token=${this.config.token}`)
  }

  private get kernelsUrl() {
    return url.resolve(this.config.juptyerUrl, this.kernelApiPath);
  }

  private kernelIdUrl(kernelId: string) {
    return url.resolve(this.kernelsUrl, `${this.kernelApiPath}/${kernelId}`);
  }

  private get requestHeaders() {
    return {
      Authorization: `token ${this.config.token}`
    };
  }

  private get<R>(url: string): RequestPromise<R> {
    return request.get(
      url,
      {
        headers: this.requestHeaders,
        json: true
      }
    );
  }

  private post<B extends {}, R>(url: string, body?: B): RequestPromise<R> {
    return request.post(
      url,
      {
        headers: this.requestHeaders,
        body,
        json: true
      }
    );
  }

  static loadKernelConfig(
    kernelId: string,
    kernelConfigFolder: string,
    createFilename: (kernelId: string) => string = KernelRuntimeConfig.createFilename
  ): Promise<KernelRuntimeConfig> {
    return readFile(
        join(kernelConfigFolder, createFilename(kernelId)),
        { encoding: 'utf-8' }
      )
      .then(KernelRuntimeConfig.parseConfigFile);
  }
}
