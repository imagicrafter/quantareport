
/**
 * OpenAI Proxy Client for Custom Reports
 * 
 * This utility provides a simple interface for custom reports to interact
 * with OpenAI API through the secure proxy endpoint.
 */

interface OpenAIProxyRequest {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

interface OpenAIProxyResponse {
  success: boolean;
  data?: any;
  error?: string;
}

class OpenAIProxyClient {
  private baseUrl: string;

  constructor() {
    // Use the current domain to construct the proxy URL
    this.baseUrl = `${window.location.origin}/functions/v1/openai-proxy`;
  }

  /**
   * Make a request to OpenAI API through the proxy
   */
  async request({
    endpoint,
    method = 'POST',
    body,
    headers = {}
  }: OpenAIProxyRequest): Promise<OpenAIProxyResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          endpoint,
          method,
          body,
          headers
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Request failed'
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Chat completions endpoint
   */
  async chatCompletions(messages: any[], options: any = {}) {
    return this.request({
      endpoint: 'chat/completions',
      body: {
        model: 'gpt-4o-mini',
        messages,
        ...options
      }
    });
  }

  /**
   * Generate images
   */
  async generateImage(prompt: string, options: any = {}) {
    return this.request({
      endpoint: 'images/generations',
      body: {
        model: 'gpt-image-1',
        prompt,
        n: 1,
        size: '1024x1024',
        ...options
      }
    });
  }

  /**
   * Get embeddings
   */
  async getEmbeddings(input: string | string[], options: any = {}) {
    return this.request({
      endpoint: 'embeddings',
      body: {
        model: 'text-embedding-3-small',
        input,
        ...options
      }
    });
  }

  /**
   * Content moderation
   */
  async moderate(input: string) {
    return this.request({
      endpoint: 'moderations',
      body: { input }
    });
  }
}

// Export a global instance for easy use in custom reports
export const openAI = new OpenAIProxyClient();

// Also export the class for advanced usage
export { OpenAIProxyClient };

// Make it available globally for custom reports
if (typeof window !== 'undefined') {
  (window as any).OpenAI = openAI;
  (window as any).OpenAIProxyClient = OpenAIProxyClient;
}
