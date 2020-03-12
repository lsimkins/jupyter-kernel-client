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
      'f1b02a75-6375-44ad-8c1c-04874fac960a',
      connPath
    );

  const client = new KernelClient(kConfig);

  // client.connect();

  client.iopub.connect();
  client.iopub.listen(console.debug);

  process.on('SIGINT', () => {
    console.info('Closing zeromq connection');
    client.disconnect();
    client.iopub.disconnect();
  });
}());

const manager = new KernelManager({
  juptyerUrl: juptyerHost,
  kernelConnPath: process.env.KERNEL_CONN_PATH,
  token: process.env.JUPYTER_TOKEN
});

// manager.startKernel('python3').then(console.debug).catch(console.error);
manager.listKernels().then(console.debug).catch(console.error);



// manager.listKernels().then(console.debug).catch(console.error);

// client.executeRequest();