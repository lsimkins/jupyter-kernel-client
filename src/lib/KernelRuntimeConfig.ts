import { has, camelCase, contains, every } from 'lodash/fp';

export type KernelRuntimeConfig = {
  shellPort: number;
  iopubPort: number;
  stdinPort: number;
  controlPort: number;
  hbPort: number;
  ip: string;
  key: string;
  transport: string;
  signatureScheme: string;
  kernelName: string;
};

export const KernelRuntimeConfig = {
  configFields: new Set([
    'shell_port',
    'iopub_port',
    'stdin_port',
    'control_port',
    'hb_port',
    'ip',
    'key',
    'transport',
    'signature_acheme',
    'kernel_name',
  ]),

  createFilename(id: string): string {
    return `kernel-${id}.json`;
  },

  parseConfigFile: function(fileContents: string): KernelRuntimeConfig {
    const file = JSON.parse(fileContents);
    const { validKernelConfig, configFields } = KernelRuntimeConfig;

    if (!validKernelConfig(fileContents)) {
      console.error(`Unable to parse invalid kernel config`, file);
      throw 'Invalid Kernel Config Error';
    }

    let parsed: Partial<KernelRuntimeConfig> = {};
    for (let field of configFields) {
      parsed[camelCase(field)] = file[field];
    }

    return parsed as KernelRuntimeConfig;
  },

  validKernelConfig: function(fileJson: Object): boolean {
    const { configFields } = KernelRuntimeConfig;
    const fields = Object.keys(fileJson);

    return every((val: string) => has(val, fields), configFields);
  }
};