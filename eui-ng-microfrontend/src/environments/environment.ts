import { EuiEnvConfig } from '@eui/core';

interface EnvConfig extends EuiEnvConfig {
    production: boolean;
}

export const environment: EnvConfig = {
    production: false,
    enableDevToolRedux: true,
    envDynamicConfig: {
        uri: 'http://localhost:4300/assets/env-json-config.json',
        deepMerge: true,
        merge: ['modules'],
    },
};
