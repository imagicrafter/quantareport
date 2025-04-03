
/**
 * Central webhook configuration service
 * Manages webhook URLs across different environments
 */

// Define environment types
export type Environment = 'development' | 'staging' | 'production';

// Define webhook types
export type WebhookType = 'report' | 'file-analysis' | 'note';

// Interface for webhook configuration
export interface WebhookConfig {
  development: string;
  staging: string;
  production: string;
}

// Get current environment from ENV var or determine from URL
export const getCurrentEnvironment = (): Environment => {
  // First priority: Check for explicit environment variable
  const envVar = import.meta.env.VITE_APP_ENVIRONMENT;
  
  console.log('Current VITE_APP_ENVIRONMENT:', envVar);
  
  if (envVar === 'development' || envVar === 'staging' || envVar === 'production') {
    console.log('Using environment from VITE_APP_ENVIRONMENT:', envVar);
    return envVar as Environment;
  }

  // Second priority: Determine from hostname
  const hostname = window.location.hostname;
  console.log('Determining environment from hostname:', hostname);
  
  if (hostname.includes('localhost') || hostname.includes('dev') || hostname.includes('preview') || hostname.includes('127.0.0.1') || hostname.match(/\d+\.\d+\.\d+\.\d+/)) {
    console.log('Environment detected: development (from IP/localhost)');
    return 'development';
  } else if (hostname.includes('staging') || hostname.includes('test')) {
    console.log('Environment detected: staging');
    return 'staging';
  } else {
    console.log('Environment detected: production (default)');
    return 'production';
  }
};

// Base URL for the proxy function
const getProxyBaseUrl = () => {
  // Allow override of the base proxy URL if needed
  return import.meta.env.VITE_WEBHOOK_PROXY_BASE_URL || 
    "https://vtaufnxworztolfdwlll.supabase.co/functions/v1/n8n-webhook-proxy";
};

// Consolidated approach to define webhook configurations
// Uses the proxy by default for all environments
const webhookConfigs: Record<WebhookType, WebhookConfig> = {
  report: {
    // Report generation webhooks - all through proxy
    development: import.meta.env.VITE_N8N_DEV_WEBHOOK || 
      `${getProxyBaseUrl()}/proxy?env=development&type=report`,
    staging: import.meta.env.VITE_N8N_STAGING_WEBHOOK || 
      `${getProxyBaseUrl()}/proxy?env=staging&type=report`,
    production: import.meta.env.VITE_N8N_PROD_WEBHOOK || 
      `${getProxyBaseUrl()}/proxy?env=production&type=report`
  },
  'file-analysis': {
    // File analysis webhooks - all through proxy
    development: import.meta.env.VITE_FILE_ANALYSIS_DEV_WEBHOOK || 
      `${getProxyBaseUrl()}/proxy?env=development&type=file-analysis`,
    staging: import.meta.env.VITE_FILE_ANALYSIS_STAGING_WEBHOOK || 
      `${getProxyBaseUrl()}/proxy?env=staging&type=file-analysis`,
    production: import.meta.env.VITE_FILE_ANALYSIS_PROD_WEBHOOK || 
      `${getProxyBaseUrl()}/proxy?env=production&type=file-analysis`
  },
  note: {
    // Note webhooks - all through proxy
    development: import.meta.env.VITE_N8N_NOTE_DEV_WEBHOOK || 
      `${getProxyBaseUrl()}/proxy?env=development&type=note`,
    staging: import.meta.env.VITE_N8N_NOTE_STAGING_WEBHOOK || 
      `${getProxyBaseUrl()}/proxy?env=staging&type=note`,
    production: import.meta.env.VITE_N8N_NOTE_PROD_WEBHOOK || 
      `${getProxyBaseUrl()}/proxy?env=production&type=note`
  }
};

// For direct access to original webhook URLs (for admin/debug purposes)
export const originalWebhookUrls = {
  report: {
    development: 'https://n8n-01.imagicrafterai.com/webhook-test/785af48f-c1b1-484e-8bea-21920dee1146',
    staging: 'https://n8n-01.imagicrafterai.com/webhook-staging/785af48f-c1b1-484e-8bea-21920dee1146',
    production: 'https://n8n-01.imagicrafterai.com/webhook/785af48f-c1b1-484e-8bea-21920dee1146'
  },
  'file-analysis': {
    development: 'https://n8n-01.imagicrafterai.com/webhook-test/7981ebe6-58f6-4b8f-9fdb-0e7b2e1020f0',
    staging: 'https://n8n-01.imagicrafterai.com/webhook/7981ebe6-58f6-4b8f-9fdb-0e7b2e1020f0', 
    production: 'https://n8n-01.imagicrafterai.com/webhook/7981ebe6-58f6-4b8f-9fdb-0e7b2e1020f0'
  },
  note: {
    development: 'https://n8n-01.imagicrafterai.com/webhook-test/62d6d438-48ae-47db-850e-5fc52f54e843',
    staging: 'https://n8n-01.imagicrafterai.com/webhook/62d6d438-48ae-47db-850e-5fc52f54e843',
    production: 'https://n8n-01.imagicrafterai.com/webhook/62d6d438-48ae-47db-850e-5fc52f54e843'
  }
};

// Get webhook URL for specified type and environment
export const getWebhookUrl = (type: WebhookType, env?: Environment): string => {
  const environment = env || getCurrentEnvironment();
  return webhookConfigs[type][environment];
};

// Get direct webhook URL (bypass proxy) for specified type and environment
export const getDirectWebhookUrl = (type: WebhookType, env?: Environment): string => {
  const environment = env || getCurrentEnvironment();
  return originalWebhookUrls[type][environment];
};

// Get all webhook URLs for current environment
export const getAllWebhookUrls = (env?: Environment): Record<WebhookType, string> => {
  const environment = env || getCurrentEnvironment();
  return {
    report: webhookConfigs.report[environment],
    'file-analysis': webhookConfigs['file-analysis'][environment],
    note: webhookConfigs.note[environment]
  };
};

// Get all direct webhook URLs for current environment
export const getAllDirectWebhookUrls = (env?: Environment): Record<WebhookType, string> => {
  const environment = env || getCurrentEnvironment();
  return {
    report: originalWebhookUrls.report[environment],
    'file-analysis': originalWebhookUrls['file-analysis'][environment],
    note: originalWebhookUrls.note[environment]
  };
};

// Get full configuration for displaying in admin panel
export const getFullWebhookConfig = (): Record<WebhookType, WebhookConfig> => {
  return { ...webhookConfigs };
};

// Get full direct configuration for displaying in admin panel
export const getFullDirectWebhookConfig = (): Record<WebhookType, WebhookConfig> => {
  return { ...originalWebhookUrls };
};

// Check if a URL is using the proxy
export const isProxyUrl = (url: string): boolean => {
  return url.includes(getProxyBaseUrl());
};

// Check if a URL is external
export const isExternalUrl = (url: string): boolean => {
  return !isProxyUrl(url) && 
         url !== originalWebhookUrls.report.development && 
         url !== originalWebhookUrls.report.production &&
         url !== originalWebhookUrls['file-analysis'].development &&
         url !== originalWebhookUrls['file-analysis'].production &&
         url !== originalWebhookUrls.note.development &&
         url !== originalWebhookUrls.note.production;
};
