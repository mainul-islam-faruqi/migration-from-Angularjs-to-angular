import { EuiEnvConfig } from '@eui/core';

interface EnvConfig extends EuiEnvConfig {
    production: boolean;
}

export const environment = {
  production: false,
  microfrontendBase: 'http://localhost:4300',
  assetBasePath: '/assets',
  euiStylesPath: '/@eui/styles/dist/assets'
};
