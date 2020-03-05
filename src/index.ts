require('module-alias/register');

import KernelManager from '@lib/kernel-manager';
import KernelClient from '@lib/kernel-client';
import { KernelRuntimeConfig } from '@lib/kernel-runtime-config';

// DEV
require('dotenv').config();

const juptyerHost = process.env.JUPYTER_HOST || 'http://localhost:8888';

if (!process.env.KERNEL_CONN_PATH) {
  throw 'KERNEL_CONN_PATH env variable must be set.';
}

const connPath = process.env.KERNEL_CONN_PATH;

if (!process.env.JUPYTER_TOKEN) {
  throw 'JUPYTER_TOKEN env variable must be set.';
}

(async function() {
  const kConfig = await KernelManager
    .loadKernelConfig(
      '97a1d86e-6d6b-4b0f-995a-8d11486cdfed',
      connPath
    );

  const client = new KernelClient(kConfig);

  client.connect();

  process.on('SIGINT', () => {
    console.info('Closing zeromq connection');
    client.disconnect();
  });
}());

// const manager = new KernelManager({
//   juptyerUrl: juptyerHost,
//   kernelConnPath: process.env.KERNEL_CONN_PATH,
//   token: process.env.JUPYTER_TOKEN
// });

// manager.startKernel('python3').then(console.debug).catch(console.error);
// manager.listKernels().then(console.debug).catch(console.error);



// manager.listKernels().then(console.debug).catch(console.error);

// client.executeRequest();