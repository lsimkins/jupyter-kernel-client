import KernelManager from '../lib/kernel-manager';
import nock, { isDone } from 'nock';
import mockfs from 'mock-fs';
import console from './mocks/console';

describe('KernelManager', () => {
  const mockHost = 'http://notebook-server';
  const mockToken = 'someAuthToken';
  const expectedHeaders = {
    authorization: `token ${mockToken}`,
    host: 'notebook-server'
  };
  const kernelId = '739507cf-a319-4d44-b82d-830ba1f6819e';
  const kernelModel = {
    'id': kernelId,
    'name': 'python3',
    'last_activity': '2019-04-17T20:44:54.860383Z',
    'execution_state': 'idle',
    'connections': 1
  };

  const newKernelModel = {
    'id': kernelId,
    'name': 'python3',
    'last_activity': new Date().toISOString(),
    'execution_state': 'starting',
    'connections': 0
  };

  const realHost = 'http://localhost:8888';
  const realToken = '7c85f0f114d57a05b7dc82f4f24d586906a05fbc6f5364b4';
  const mockConfig = {
    juptyerUrl: mockHost,
    kernelConnPath: '/path/to/kernel/json',
    token: mockToken
  };

  const realConfig = {
    juptyerUrl: realHost,
    kernelConnPath: '/path/to/kernel/json',
    token: realToken
  }

  beforeEach(() => {
    nock(mockHost, { reqheaders: expectedHeaders })
      .get('/api/kernels')
      .reply(200, [kernelModel]);

    nock(mockHost, { reqheaders: expectedHeaders })
      .get(`/api/kernels/${kernelId}`)
      .reply(200, kernelModel);

    nock(mockHost, { reqheaders: expectedHeaders })
      .post(`/api/kernels`, { name: 'python3' })
      .reply(200, newKernelModel);

    nock(mockHost, { reqheaders: expectedHeaders })
      .post(`/api/kernels/${kernelId}/restart`)
      .reply(200, kernelModel);

    nock(mockHost, { reqheaders: expectedHeaders })
      .post(`/api/kernels/${kernelId}/interrupt`)
      .reply(204);

    nock(mockHost, { reqheaders: expectedHeaders })
      .post(`/api/kernels/${kernelId}/interrupt`)
      .reply(204);
  });;

  afterEach(() => {
    nock.cleanAll();
    mockfs.restore();
  });

  it('should GET /api/kernels, returning a list of kernel models', async done => {
    const manager = new KernelManager(mockConfig);
    const kernels = await manager.listKernels();

    expect(kernels).toEqual([kernelModel]);
    done()
  });

  it('should GET /api/kernels/<kernel_id>, returning a single kernel models', async done => {
    const manager = new KernelManager(mockConfig);
    const kernels = await manager.getKernel(kernelId);

    expect(kernels).toEqual(kernelModel);
    done()
  });

  it('should POST /api/kernels/<kernel_id>, starting a kernel with the specified spec', async done => {
    const manager = new KernelManager(mockConfig);
    const kernels = await manager.startKernel('python3');

    expect(kernels).toEqual(newKernelModel);
    done()
  });

  it('should DELETE /api/kernels/<kernel_id>, shutting down/deleting a kernel with the specified spec', async done => {
    const manager = new KernelManager(mockConfig);
    const kernels = await manager.startKernel('python3');

    expect(kernels).toEqual(newKernelModel);
    done()
  });

  it('should POST /api/kernels/<kernel_id>/restart, restarting a kernel', async done => {
    const manager = new KernelManager(mockConfig);
    const restartedKernel = await manager.restartKernel(kernelId);

    expect(restartedKernel).toEqual(kernelModel);
    done()
  });

  it('should POST /api/kernels/<kernel_id>/interrupt, interrupting a kernel', async done => {
    const manager = new KernelManager(mockConfig);
    const response = await manager.interruptKernel(kernelId);

    expect(response).toEqual(undefined);
    done()
  });

  it('should load a kernel config file', async (done) => {
    const kernelId = '123-kernel-id';
    const kernelFolder = '/path/to/kernel/folder/';
    const kernelFile = `kernel-${kernelId}.json`;
    const configFile = Buffer.from(JSON.stringify({
      shell_port: 59488,
      iopub_port: 59489,
      stdin_port: 59490,
      control_port: 59491,
      hb_port: 59492,
      ip: '127.0.0.1',
      key: '8ab5c2e0-31670508ef13209017f73afa',
      transport: 'tcp',
      signature_scheme: 'hmac-sha256',
      kernel_name: ''
    }));

    mockfs({
      [`${kernelFolder}/${kernelFile}`]: configFile
    });

    KernelManager.loadKernelConfig(kernelId, kernelFolder)
      .then(result => {
          expect(result).toEqual({
            shellPort: 59488,
            iopubPort: 59489,
            stdinPort: 59490,
            controlPort: 59491,
            hbPort: 59492,
            ip: '127.0.0.1',
            key: '8ab5c2e0-31670508ef13209017f73afa',
            transport: 'tcp',
            signatureScheme: 'hmac-sha256',
            kernelName: ''
          });
          done();
        })
        .catch(fail);
  });

  it('should throw an exception when loading an invalid config file', async done => {
    const kernelId = '123-kernel-id';
    const kernelFolder = '/path/to/kernel/folder/';
    const kernelFile = `kernel-${kernelId}.json`;
    const configFile = Buffer.from(JSON.stringify({
      shell_port: 59488,
      iopub_port: 59489,
      stdin_port: 59490,
      hb_port: 59492,
      ip: '127.0.0.1',
      key: '8ab5c2e0-31670508ef13209017f73afa',
      transport: 'tcp',
      signature_scheme: 'hmac-sha256',
      kernel_name: 'kernel-name'
    }));

    mockfs({
      [`${kernelFolder}/${kernelFile}`]: configFile
    });

    const catchError = jest.fn();

    KernelManager.loadKernelConfig('invalid_id', kernelFolder)
      .then(fail)
      .catch(catchError)
      .finally(() => {
        expect(catchError).toHaveBeenCalled();
        done()
      });
  });
});

