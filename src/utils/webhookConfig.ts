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
  // Check if environment is explicitly set
  const envVar = import.meta.env.VITE_APP_ENVIRONMENT;
  if (envVar && ['development', 'staging', 'production'].includes(envVar)) {
    return envVar as Environment;
  }

  // Otherwise determine from hostname
  const hostname = window.location.hostname;
  
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return 'development';
  } else if (hostname.includes('staging') || hostname.includes('test')) {
    return 'staging';
  } else {
    return 'production';
  }
};

// Webhook configurations
const webhookConfigs: Record<WebhookType, WebhookConfig> = {
  report: {
    // Report generation webhooks
    development: import.meta.env.VITE_N8N_DEV_WEBHOOK || 
      'https://n8n-01.imagicrafterai.com/webhook-test/785af48f-c1b1-484e-8bea-21920dee1146',
    staging: import.meta.env.VITE_N8N_STAGING_WEBHOOK || 
      'https://n8n-01.imagicrafterai.com/webhook-staging/785af48f-c1b1-484e-8bea-21920dee1146',
    production: import.meta.env.VITE_N8N_PROD_WEBHOOK || 
      'https://n8n-01.imagicrafterai.com/webhook/785af48f-c1b1-484e-8bea-21920dee1146'
  },
  'file-analysis': {
    // File analysis webhooks
    development: import.meta.env.VITE_FILE_ANALYSIS_DEV_WEBHOOK || 
      'https://n8n-01.imagicrafterai.com/webhook-test/7981ebe6-58f6-4b8f-9fdb-0e7b2e1020f0',
    staging: import.meta.env.VITE_FILE_ANALYSIS_STAGING_WEBHOOK || 
      'https://n8n-01.imagicrafterai.com/webhook-staging/7981ebe6-58f6-4b8f-9fdb-0e7b2e1020f0',
    production: import.meta.env.VITE_FILE_ANALYSIS_PROD_WEBHOOK || 
      'https://n8n-01.imagicrafterai.com/webhook/7981ebe6-58f6-4b8f-9fdb-0e7b2e1020f0'
  },
  note: {
    // Note webhooks
    development: import.meta.env.VITE_N8N_NOTE_DEV_WEBHOOK || 
      'https://vtaufnxworztolfdwlll.supabase.co/functions/v1/n8n-proxy?env=dev',
    staging: import.meta.env.VITE_N8N_NOTE_STAGING_WEBHOOK || 
      'https://vtaufnxworztolfdwlll.supabase.co/functions/v1/n8n-proxy?env=staging',
    production: import.meta.env.VITE_N8N_NOTE_PROD_WEBHOOK || 
      'https://vtaufnxworztolfdwlll.supabase.co/functions/v1/n8n-proxy?env=prod'
  }
};

// Get webhook URL for specified type and environment
export const getWebhookUrl = (type: WebhookType, env?: Environment): string => {
  const environment = env || getCurrentEnvironment();
  return webhookConfigs[type][environment];
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

// Get full configuration for displaying in admin panel
export const getFullWebhookConfig = (): Record<WebhookType, WebhookConfig> => {
  return { ...webhookConfigs };
};

// Check if a URL is external to determine if it's using environment variables
export const isExternalUrl = (url: string): boolean => {
  return url !== webhookConfigs.report.development && 
         url !== webhookConfigs.report.production &&
         url !== webhookConfigs['file-analysis'].development &&
         url !== webhookConfigs['file-analysis'].production &&
         url !== webhookConfigs.note.development &&
         url !== webhookConfigs.note.production;
};
