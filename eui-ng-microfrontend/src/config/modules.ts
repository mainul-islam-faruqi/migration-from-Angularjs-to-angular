import { ModulesConfig } from '@eui/core';

// Dynamic configuration based on environment
const getApiBaseUrl = () => {
    const isDev = window.location.hostname === 'localhost';
    if (isDev) {
        // In development, API calls should go to Angular app server
        return 'http://localhost:4300/api';
    }
    // In production, this could point to actual API server
    return '/api';
};

export const MODULES: ModulesConfig = {
    core: {
        base: getApiBaseUrl(),
        userDetails: '/user-details'
    }
};
