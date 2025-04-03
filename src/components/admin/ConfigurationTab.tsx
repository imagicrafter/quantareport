
import { useState, useEffect } from 'react';
import { 
  getCurrentEnvironment,
  fetchWebhookConfig,
  getAllWebhookUrls,
  WebhookType,
  isProxyUrl,
} from '@/utils/webhookConfig';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  Copy, 
  ExternalLink,
  RefreshCcw,
  AlertTriangle,
  Globe,
  Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Define proper types for webhook configurations
interface WebhookConfigData {
  environment: string;
  webhooks: Record<WebhookType, Record<string, string>>;
  currentWebhooks: Record<WebhookType, string>;
  version: string;
  timestamp: string;
}

interface WebhookState {
  proxyUrls: Record<WebhookType, string>;
  configData: WebhookConfigData | null;
  loading: boolean;
  error: string | null;
}

const ConfigurationTab = () => {
  const [environment, setEnvironment] = useState<string>('');
  const [webhookState, setWebhookState] = useState<WebhookState>({
    proxyUrls: {
      'file-analysis': '',
      'report': '',
      'note': ''
    },
    configData: null,
    loading: true,
    error: null
  });
  
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [envVarValue, setEnvVarValue] = useState<string>('Not set');

  useEffect(() => {
    const init = async () => {
      setWebhookState(prev => ({ ...prev, loading: true, error: null }));
      try {
        // Force getting current environment (no caching)
        const env = getCurrentEnvironment();
        console.log('ConfigurationTab: Current environment:', env);
        setEnvironment(env);
        
        // Get env variable value directly
        const envVar = import.meta.env.VITE_APP_ENVIRONMENT;
        setEnvVarValue(envVar || 'Not set');
        
        // Get current webhook URLs (proxy URLs generated on client side)
        const proxyUrls = getAllWebhookUrls(env);
        
        // Try to get webhook configuration from the edge function
        try {
          const configData = await fetchWebhookConfig(env);
          if (configData) {
            console.log('Received edge function webhook config:', configData);
            setWebhookState({
              proxyUrls,
              configData,
              loading: false,
              error: null
            });
          }
        } catch (edgeFnError) {
          console.warn('Failed to get webhook config from edge function:', edgeFnError);
          setWebhookState({
            proxyUrls,
            configData: null,
            loading: false,
            error: `Failed to load edge function config: ${edgeFnError instanceof Error ? edgeFnError.message : String(edgeFnError)}`
          });
        }
        
      } catch (error) {
        console.error('Error initializing config tab:', error);
        toast.error('Failed to load configuration data');
        setWebhookState(prev => ({
          ...prev,
          loading: false,
          error: `Error: ${error instanceof Error ? error.message : String(error)}`
        }));
      }
    };

    init();
  }, [refreshKey]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getEnvBadgeColor = (env: string) => {
    switch (env) {
      case 'development':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'staging':
        return 'bg-amber-500 hover:bg-amber-600';
      case 'production':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const formatWebhookName = (name: string): string => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const refreshConfig = () => {
    window.location.reload();
  };

  if (webhookState.loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 animate-spin" />
          <span>Loading configuration...</span>
        </div>
      </div>
    );
  }

  const envMismatch = envVarValue && envVarValue !== 'Not set' && envVarValue !== environment;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Environment Settings</CardTitle>
              <Badge className={getEnvBadgeColor(environment)}>
                {environment.toUpperCase()}
              </Badge>
            </div>
          </div>
          <CardDescription>
            Current application environment and configuration details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {envMismatch && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Environment variable mismatch detected</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Your VITE_APP_ENVIRONMENT is set to "{envVarValue}" but the application is running in "{environment}" mode. 
                  Try restarting your application or clearing cache.
                </p>
              </div>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground mb-4">
            The application is currently running in <strong>{environment}</strong> mode.
            Webhooks and other environment-specific settings are configured accordingly.
          </p>
          
          <div className="border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium">Setting</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-4 py-3 text-sm">App Environment</td>
                  <td className="px-4 py-3 text-sm">{environment}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm">Env Variable</td>
                  <td className="px-4 py-3 text-sm flex items-center">
                    <span className={envMismatch ? "text-yellow-600 font-medium" : ""}>
                      {envVarValue}
                    </span>
                    {envMismatch && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500 ml-2" />
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm">Host Name</td>
                  <td className="px-4 py-3 text-sm">{window.location.hostname}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm">Base URL</td>
                  <td className="px-4 py-3 text-sm flex items-center gap-2">
                    {window.location.origin}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-5"
                      onClick={() => copyToClipboard(window.location.origin)}
                    >
                      <Copy className="size-3" />
                    </Button>
                  </td>
                </tr>
                {webhookState.configData && (
                  <tr>
                    <td className="px-4 py-3 text-sm">Edge Function Version</td>
                    <td className="px-4 py-3 text-sm">{webhookState.configData.version || 'Unknown'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>
            Webhook endpoints for the current environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {webhookState.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Error fetching webhook configuration</p>
                <p className="text-xs text-red-700 mt-1">{webhookState.error}</p>
              </div>
            </div>
          )}

          <Tabs defaultValue="current">
            <TabsList className="mb-4">
              <TabsTrigger value="current">Current Environment</TabsTrigger>
              <TabsTrigger value="all">All Environments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="current">
              {webhookState.configData ? (
                <>
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center mb-2">
                      <Globe className="h-4 w-4 text-blue-500 mr-2" />
                      <p className="text-sm font-medium text-blue-800">Webhook URLs for {environment}</p>
                    </div>
                    <p className="text-xs text-blue-700">
                      These are the actual webhook URLs for your current environment ({environment}).
                      These URLs are used by the Supabase edge function proxy to route requests.
                    </p>
                  </div>
                
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium">Webhook Type</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">URL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {webhookState.configData && webhookState.configData.currentWebhooks && 
                          Object.entries(webhookState.configData.currentWebhooks).map(([type, url]) => (
                            <tr key={type}>
                              <td className="px-4 py-3 text-sm">{formatWebhookName(type)}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-[500px]">
                                {typeof url === 'string' ? url : 'N/A'}
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="p-6 flex justify-center items-center border rounded-md">
                  <p className="text-sm text-muted-foreground">
                    {webhookState.error ? 
                      "Failed to load webhook configuration from edge function." : 
                      "No configuration data available. Try refreshing."}
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="all">
              {webhookState.configData ? (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium">Webhook Type</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Environment</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">URL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {webhookState.configData.webhooks && 
                       Object.entries(webhookState.configData.webhooks).flatMap(([type, envUrls]) => 
                        Object.entries(envUrls).map(([env, url]) => (
                          <tr key={`${type}-${env}`}>
                            <td className="px-4 py-3 text-sm">
                              {formatWebhookName(type)}
                            </td>
                            <td className="px-4 py-3">
                              <Badge 
                                variant={env === environment ? "default" : "outline"}
                                className={env === environment ? getEnvBadgeColor(env) : ""}
                              >
                                {env}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-[300px] relative group">
                              <div className="flex items-center">
                                <span className="mr-2 truncate">{typeof url === 'string' ? url : 'N/A'}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="size-5 opacity-0 group-hover:opacity-100"
                                  onClick={() => typeof url === 'string' && copyToClipboard(url)}
                                >
                                  <Copy className="size-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 flex justify-center items-center border rounded-md">
                  <p className="text-sm text-muted-foreground">
                    {webhookState.error ? 
                      "Failed to load webhook configuration from edge function." : 
                      "No configuration data available. Try refreshing."}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edge Function Status</CardTitle>
          <CardDescription>
            Deployment status of webhook edge functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To update your edge functions on Supabase, you need to explicitly deploy them:
            </p>
            
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-md text-amber-800">
              <h3 className="font-medium mb-2">Updating Edge Functions</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Changes to edge function code in your local project are NOT automatically deployed to Supabase</li>
                <li>You need to manually deploy edge functions using the Supabase CLI</li>
                <li>Run: <code className="bg-amber-100 px-2 py-1 rounded">supabase functions deploy n8n-webhook-proxy</code></li>
                <li>Or deploy through the Supabase Dashboard UI by uploading the updated file</li>
                <li>Run: <code className="bg-amber-100 px-2 py-1 rounded">cd supabase && npx supabase functions deploy n8n-webhook-proxy</code></li>
              </ol>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-md text-blue-800 mt-4">
              <h3 className="font-medium mb-2">Testing Edge Function Changes</h3>
              <p className="mb-2">To verify your edge function version and configuration:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Visit the status endpoint: <code className="bg-blue-100 px-2 py-1 rounded">/n8n-webhook-proxy/status</code></li>
                <li>Check the version number to confirm your deployment was successful</li>
                <li>Verify webhook URLs in the configuration endpoint: <code className="bg-blue-100 px-2 py-1 rounded">/n8n-webhook-proxy/config</code></li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigurationTab;
