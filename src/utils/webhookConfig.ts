
/**
 * Central webhook configuration service
 * Manages webhook URLs across different environments
 */

// Define environment types
export type Environment = 'development' | 'staging' | 'production';

// Define webhook types
export type WebhookType = 'report' | 'file-analysis' | 'note';

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

// Get the Supabase project URL from config
const getSupabaseProjectUrl = () => {
  // This can be overridden by an environment variable if needed
  return import.meta.env.VITE_SUPABASE_URL || 
    "https://vtaufnxworztolfdwlll.supabase.co";
};

// Base URL for the proxy function
const getProxyBaseUrl = () => {
  return `${getSupabaseProjectUrl()}/functions/v1/n8n-webhook-proxy`;
};

// Get webhook URL for specified type and environment
export const getWebhookUrl = (type: WebhookType, env?: Environment): string => {
  const environment = env || getCurrentEnvironment();
  return `${getProxyBaseUrl()}/proxy?env=${environment}&type=${type}`;
};

// Get all webhook URLs for current environment
export const getAllWebhookUrls = (env?: Environment): Record<WebhookType, string> => {
  const environment = env || getCurrentEnvironment();
  return {
    report: getWebhookUrl('report', environment),
    'file-analysis': getWebhookUrl('file-analysis', environment),
    note: getWebhookUrl('note', environment)
  };
};

// Check if a URL is using the proxy
export const isProxyUrl = (url: string): boolean => {
  return url.includes(getProxyBaseUrl());
};

// Fetch webhook configuration from the edge function
export const fetchWebhookConfig = async (env?: Environment): Promise<any> => {
  const environment = env || getCurrentEnvironment();
  try {
    const response = await fetch(`${getProxyBaseUrl()}/config?env=${environment}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching webhook config:', error);
    throw error;
  }
};
