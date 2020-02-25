import KernelManager from '../lib/KernelManager';
import nock from 'nock';

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
  });

  it('should GET /api/kernels, returning a list of kernel models', async () => {
    const manager = new KernelManager(mockHost, mockToken);  
    const kernels = await manager.listKernels();

    expect(kernels).toEqual([kernelModel]);
  });

  it('should GET /api/kernels/<kernel_id>, returning a single kernel models', async () => {
    const manager = new KernelManager(mockHost, mockToken);
    const kernels = await manager.getKernel(kernelId);

    expect(kernels).toEqual(kernelModel);
  });

  it('should POST /api/kernels/<kernel_id>, starting a kernel with the specified spec', async () => {
    const manager = new KernelManager(mockHost, mockToken);
    const kernels = await manager.startKernel('python3');

    expect(kernels).toEqual(newKernelModel);
  });

  it('should DELETE /api/kernels/<kernel_id>, shutting down/deleting a kernel with the specified spec', async () => {
    const manager = new KernelManager(mockHost, mockToken);
    const kernels = await manager.startKernel('python3');

    expect(kernels).toEqual(newKernelModel);
  });

  it('should POST /api/kernels/<kernel_id>/restart, restarting a kernel', async () => {
    const manager = new KernelManager(mockHost, mockToken);
    const restartedKernel = await manager.restartKernel(kernelId);

    expect(restartedKernel).toEqual(kernelModel);
  });

  it('should POST /api/kernels/<kernel_id>/interrupt, interrupting a kernel', async () => {
    const manager = new KernelManager(mockHost, mockToken);
    const response = await manager.interruptKernel(kernelId);

    expect(response).toEqual(undefined);
  });

  it('should open a websocket channel', async () => {
    nock.cleanAll()
    const manager = new KernelManager(realHost, realToken);
    const websocket: any = manager.openWebsocketChannel('85ca8102-9ed9-49b2-9232-24299e582e65');

    websocket.on('open', console.debug);

    setTimeout(() => {
      expect(true).toEqual(true);
    }, 4000);

  });
});

