
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

// Check if we're in development environment
export const isDevelopmentEnvironment = (): boolean => {
  return getCurrentEnvironment() === 'development';
};

// Get the Supabase project URL from config
const getSupabaseProjectUrl = () => {
  return "https://vtaufnxworztolfdwlll.supabase.co";
};

// Base URL for the proxy function
const getProxyBaseUrl = () => {
  return `${getSupabaseProjectUrl()}/functions/v1/n8n-webhook-proxy`;
};

// Get test-specific webhook URL for development environment
export const getTestWebhookUrl = (type: WebhookType): string | null => {
  // Only return test webhooks in development environment
  if (!isDevelopmentEnvironment()) {
    return null;
  }
  
  switch (type) {
    case 'note':
      return import.meta.env.VITE_DEV_NOTE_TEST_WEBHOOK_URL || null;
    case 'file-analysis':
      return import.meta.env.VITE_DEV_FILE_ANALYSIS_TEST_WEBHOOK_URL || null;
    case 'report':
      return import.meta.env.VITE_DEV_REPORT_TEST_WEBHOOK_URL || null;
    default:
      return null;
  }
};

// Get webhook URL for specified type and environment
export const getWebhookUrl = (type: WebhookType, env?: Environment, isTestMode: boolean = false): string => {
  const environment = env || getCurrentEnvironment();
  
  // Check if we should use test-specific webhook URLs
  if (isTestMode && environment === 'development') {
    const testWebhookUrl = getTestWebhookUrl(type);
    if (testWebhookUrl) {
      console.log(`Using test-specific webhook URL for ${type} in development environment`);
      return testWebhookUrl;
    }
    console.log(`No test-specific webhook URL found for ${type}, falling back to regular development webhook`);
  }
  
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

// Fetch webhook configuration from the edge function with timeout
export const fetchWebhookConfig = async (env?: Environment): Promise<any> => {
  const environment = env || getCurrentEnvironment();
  
  // Set a timeout for the fetch request (5 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  try {
    console.log(`Fetching webhook config for ${environment} environment`);
    const response = await fetch(`${getProxyBaseUrl()}/config?env=${environment}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error fetching webhook config:', error);
    throw error;
  }
};
