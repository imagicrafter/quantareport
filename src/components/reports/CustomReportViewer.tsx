
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { 
  getCustomReportByToken, 
  downloadCustomReportContent,
  type CustomReport 
} from '@/services/customReportsService';

const CustomReportViewer = () => {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<CustomReport | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      if (!token) {
        setError('Invalid report URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch report metadata
        const reportData = await getCustomReportByToken(token);
        if (!reportData) {
          setError('Report not found or has been deactivated');
          setLoading(false);
          return;
        }

        setReport(reportData);

        // Download HTML content using pre-authorized URL
        const content = await downloadCustomReportContent(reportData);
        if (!content) {
          setError('Failed to load report content');
          setLoading(false);
          return;
        }

        // Inject OpenAI proxy client script into the HTML content
        const injectedContent = injectOpenAIProxy(content);
        setHtmlContent(injectedContent);
      } catch (err) {
        console.error('Error loading custom report:', err);
        setError('An error occurred while loading the report');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [token]);

  const injectOpenAIProxy = (htmlContent: string): string => {
    const openAIProxyScript = `
    <script>
      // OpenAI Proxy Client for Custom Reports
      class OpenAIProxyClient {
        constructor() {
          this.baseUrl = '${window.location.origin}/functions/v1/openai-proxy';
        }

        async request({ endpoint, method = 'POST', body, headers = {} }) {
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
              error: error.message || 'Unknown error'
            };
          }
        }

        async chatCompletions(messages, options = {}) {
          return this.request({
            endpoint: 'chat/completions',
            body: {
              model: 'gpt-4o-mini',
              messages,
              ...options
            }
          });
        }

        async generateImage(prompt, options = {}) {
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

        async getEmbeddings(input, options = {}) {
          return this.request({
            endpoint: 'embeddings',
            body: {
              model: 'text-embedding-3-small',
              input,
              ...options
            }
          });
        }

        async moderate(input) {
          return this.request({
            endpoint: 'moderations',
            body: { input }
          });
        }
      }

      // Make OpenAI proxy available globally
      window.OpenAI = new OpenAIProxyClient();
      window.OpenAIProxyClient = OpenAIProxyClient;

      console.log('OpenAI Proxy Client loaded successfully');
    </script>
    `;

    // Inject the script before the closing head tag, or at the beginning of body if no head exists
    if (htmlContent.includes('</head>')) {
      return htmlContent.replace('</head>', `${openAIProxyScript}\n</head>`);
    } else if (htmlContent.includes('<body>')) {
      return htmlContent.replace('<body>', `<body>\n${openAIProxyScript}`);
    } else {
      // If no proper HTML structure, prepend the script
      return openAIProxyScript + '\n' + htmlContent;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Loading Report</h2>
            <p className="text-muted-foreground">Please wait while we load your custom report...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!htmlContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-semibold mb-2">No Content</h2>
            <p className="text-muted-foreground">The report content could not be loaded.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Add a small header for branding/context */}
      <div className="bg-white border-b px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="text-sm text-muted-foreground">
            {report?.title && (
              <span className="font-medium text-foreground">{report.title}</span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Powered by QuantaReport
          </div>
        </div>
      </div>
      
      {/* Render the HTML content in an iframe for security */}
      <iframe
        srcDoc={htmlContent}
        className="w-full border-0"
        style={{ height: 'calc(100vh - 50px)' }}
        sandbox="allow-scripts allow-same-origin allow-forms"
        title={report?.title || 'Custom Report'}
      />
    </div>
  );
};

export default CustomReportViewer;
