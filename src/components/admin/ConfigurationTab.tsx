
import { useState, useEffect } from 'react';
import { 
  getCurrentEnvironment,
  getFullWebhookConfig, 
  getAllWebhookUrls, 
  WebhookType 
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
  ExternalLink 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ConfigurationTab = () => {
  const [environment, setEnvironment] = useState<string>('');
  // Initialize with proper type structures to avoid TypeScript errors
  const [webhookConfig, setWebhookConfig] = useState<Record<WebhookType, any>>({
    'file-analysis': {},
    'report': {},
    'note': {}
  });
  const [currentWebhookUrls, setCurrentWebhookUrls] = useState<Record<WebhookType, string>>({
    'file-analysis': '',
    'report': '',
    'note': ''
  });
  const [supabsaseSecrets, setSupabaseSecrets] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // Get current environment
        const env = getCurrentEnvironment();
        setEnvironment(env);
        
        // Get all webhook configurations
        const config = getFullWebhookConfig();
        setWebhookConfig(config);
        
        // Get current webhook URLs
        const urls = getAllWebhookUrls(env);
        setCurrentWebhookUrls(urls);
        
      } catch (error) {
        console.error('Error initializing config tab:', error);
        toast.error('Failed to load configuration data');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 animate-spin" />
          <span>Loading configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Environment Settings</span>
            <Badge className={getEnvBadgeColor(environment)}>
              {environment.toUpperCase()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Current application environment and configuration details
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>
            Active webhook endpoints for the current environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="current">
            <TabsList className="mb-4">
              <TabsTrigger value="current">Current Environment</TabsTrigger>
              <TabsTrigger value="all">All Environments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="current">
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium">Webhook Type</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">URL</th>
                      <th className="px-4 py-2 text-center text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Object.entries(currentWebhookUrls).map(([type, url]) => (
                      <tr key={type}>
                        <td className="px-4 py-3 text-sm">{formatWebhookName(type)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-[300px]">
                          {url}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8"
                              onClick={() => copyToClipboard(url)}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8"
                              onClick={() => window.open(url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Open
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="all">
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
                    {Object.entries(webhookConfig).map(([type, envUrls]) => 
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
                              <span className="mr-2 truncate">{url as string}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="size-5 opacity-0 group-hover:opacity-100"
                                onClick={() => copyToClipboard(url as string)}
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigurationTab;
