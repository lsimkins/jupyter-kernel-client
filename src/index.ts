require('module-alias/register');

import KernelManager from '@lib/KernelManager';
import KernelClient from '@lib/KernelClient';
import { KernelRuntimeConfig } from '@lib/KernelRuntimeConfig';

// DEV
require('dotenv').config();

if (!process.env.KERNEL_CONN_PATH) {
  throw 'KERNEL_CONN_PATH env variable must be set.';
}

KernelManager.loadKernelConfig('84f63508-a39c-4eac-9766-40b73acecc7f', process.env.KERNEL_CONN_PATH)
  .then(console.debug);

// const manager = new KernelManager({
//   juptyerUrl: 'http://localhost:8888',
//   kernelConnPath: process.env.KERNEL_CONN_PATH,
//   token: '44196a3ab94b99fc157d9bab31e79e46846824fb9a43e8e4'
// });

// manager.startKernel('python3').then(console.debug).catch(console.error);
// manager.listKernels().then(console.debug).catch(console.error);

// const client = new KernelClient({
//   shellPort: 59855,
//   iopubPort: 59856,
//   stdinPort: 59857,
//   controlPort: 59858,
//   hbPort: 59859,
//   ip: "127.0.0.1",
//   key: "c94719e5-6c462d8557fa6c417d12b67c",
//   transport: "tcp",
//   signatureScheme: "hmac-sha256",
//   kernelName: ""
// });

// client.connect();

// process.on('SIGINT', () => {
//   console.info('Closing zeromq connection');
//   client.disconnect();
// });

// manager.listKernels().then(console.debug).catch(console.error);

// client.executeRequest();