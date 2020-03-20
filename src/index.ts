require('module-alias/register');

import KernelManager from '@lib/kernel-manager';
import KernelClient from '@lib/kernel-client';

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
      'cecafd21-20d8-4210-ba9c-a3ecc7e12e0c',
      connPath
    );

  const client = new KernelClient(kConfig);
  client.connect();

  // client.iopub.listen(console.debug);

  const cleanup = () => {
    client.disconnect();
  }

  // for await (const msg of client.iopub) {
  //   console.debug(msg);
  // }

  client.executeCode(
    '',
    { test: 'test + 1' },
    true
  ).then(console.debug);

  process.on('SIGINT', cleanup);
  process.on('SIGUSR1', cleanup);
  process.on('SIGUSR2', cleanup);
  process.on('exit', cleanup);
}());

const manager = new KernelManager({
  juptyerUrl: juptyerHost,
  kernelConnPath: process.env.KERNEL_CONN_PATH,
  token: process.env.JUPYTER_TOKEN
});

// manager.startKernel('python3').then(console.debug).catch(console.error);
// manager.listKernels().then(console.debug).catch(console.error);



// manager.listKernels().then(console.debug).catch(console.error);

// client.executeRequest();