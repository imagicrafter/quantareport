
import React from 'react';

const DocumentationTab = () => {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg text-center">
        <h1 className="text-4xl font-bold mb-2">QuantaReport</h1>
        <p className="text-xl opacity-90">Professional Report Creation Platform - Technical Documentation</p>
      </div>

      <nav className="bg-white border rounded-lg p-4 sticky top-4 z-10">
        <div className="flex flex-wrap gap-4 text-sm">
          <a href="#overview" className="text-blue-600 hover:bg-gray-100 px-3 py-2 rounded">Overview</a>
          <a href="#architecture" className="text-blue-600 hover:bg-gray-100 px-3 py-2 rounded">Architecture</a>
          <a href="#file-inventory" className="text-blue-600 hover:bg-gray-100 px-3 py-2 rounded">File Inventory</a>
          <a href="#database" className="text-blue-600 hover:bg-gray-100 px-3 py-2 rounded">Database Schema</a>
          <a href="#workflows" className="text-blue-600 hover:bg-gray-100 px-3 py-2 rounded">Workflows</a>
          <a href="#api-integrations" className="text-blue-600 hover:bg-gray-100 px-3 py-2 rounded">API Integrations</a>
          <a href="#deployment" className="text-blue-600 hover:bg-gray-100 px-3 py-2 rounded">Deployment</a>
        </div>
      </nav>

      <section id="overview" className="bg-white border rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-4 border-blue-600 pb-2">Project Overview</h2>
        <p className="text-gray-700 mb-6">
          QuantaReport is a sophisticated web application designed to streamline the creation of professional reports from uploaded images and notes. The platform leverages AI assistance for analysis and report generation while maintaining user control over content review and customization.
        </p>
        
        <h3 className="text-2xl font-semibold mb-4 text-gray-800">Core Features</h3>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li><strong>Multi-Step Report Creation:</strong> Guided 6-step workflow for report generation</li>
          <li><strong>File Management:</strong> Upload, organize, and annotate images and documents</li>
          <li><strong>AI-Powered Analysis:</strong> Automated image analysis and content generation</li>
          <li><strong>Template System:</strong> Customizable report templates with structured notes</li>
          <li><strong>Real-time Collaboration:</strong> Live progress tracking and updates</li>
          <li><strong>User Management:</strong> Role-based access control and domain isolation</li>
        </ul>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-green-500">
            <h4 className="text-lg font-semibold text-green-700 mb-3">Frontend Technologies</h4>
            <div className="flex flex-wrap gap-2">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">React 18</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">TypeScript</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Tailwind CSS</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Shadcn/UI</span>
            </div>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-red-500">
            <h4 className="text-lg font-semibold text-red-700 mb-3">Backend Services</h4>
            <div className="flex flex-wrap gap-2">
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">Supabase</span>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">Edge Functions</span>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">PostgreSQL</span>
            </div>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-orange-500">
            <h4 className="text-lg font-semibold text-orange-700 mb-3">External Integrations</h4>
            <div className="flex flex-wrap gap-2">
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">n8n Workflows</span>
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">OpenAI API</span>
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">Webhooks</span>
            </div>
          </div>
        </div>
      </section>

      <section id="architecture" className="bg-white border rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-4 border-blue-600 pb-2">System Architecture</h2>
        
        <h3 className="text-2xl font-semibold mb-4 text-gray-800">Application Structure</h3>
        <p className="text-gray-700 mb-6">
          QuantaReport follows a modern React architecture with clean separation of concerns:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-blue-700 mb-3">Presentation Layer</h4>
            <p className="text-gray-700">React components using shadcn/ui for consistent design, organized by feature domains with shared UI components.</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-blue-700 mb-3">Business Logic</h4>
            <p className="text-gray-700">Custom React hooks managing state, API calls, and business rules. Service classes handle complex operations.</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-blue-700 mb-3">Data Layer</h4>
            <p className="text-gray-700">Supabase client for database operations, file storage, and real-time subscriptions.</p>
          </div>
        </div>

        <h3 className="text-2xl font-semibold mb-4 mt-8 text-gray-800">Key Architectural Patterns</h3>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li><strong>Feature-based Organization:</strong> Code organized by business features (reports, files, notes)</li>
          <li><strong>Custom Hooks Pattern:</strong> Reusable state management and side effects</li>
          <li><strong>Service Layer:</strong> Dedicated services for complex business operations</li>
          <li><strong>Real-time Updates:</strong> WebSocket connections for live progress tracking</li>
          <li><strong>Type Safety:</strong> Comprehensive TypeScript coverage</li>
        </ul>
      </section>

      <section id="workflows" className="bg-white border rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-4 border-blue-600 pb-2">Report Creation Workflow</h2>
        
        <p className="text-gray-700 mb-6">
          The QuantaReport platform uses a structured 6-step workflow to guide users through the report creation process. The workflow state is tracked in the project_workflow table and enables seamless navigation between steps.
        </p>

        <div className="space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <h4 className="text-lg font-semibold text-blue-700 mb-2">Step 1: Initiate New Report</h4>
            <p className="text-gray-700 mb-2"><strong>Purpose:</strong> Project setup and template selection</p>
            <p className="text-gray-700"><strong>Key Actions:</strong></p>
            <ul className="list-disc pl-6 mt-2 text-gray-700">
              <li>Create new project or select existing project for update</li>
              <li>Apply default template based on user's domain</li>
              <li>Initialize template notes structure</li>
              <li>Set workflow_state = 1</li>
            </ul>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <h4 className="text-lg font-semibold text-blue-700 mb-2">Step 2: Upload and Prepare Files</h4>
            <p className="text-gray-700 mb-2"><strong>Purpose:</strong> File collection and organization</p>
            <p className="text-gray-700"><strong>Key Actions:</strong></p>
            <ul className="list-disc pl-6 mt-2 text-gray-700">
              <li>Upload images, documents, and audio files</li>
              <li>Organize files with drag-and-drop positioning</li>
              <li>Add file annotations and metadata</li>
              <li>Set workflow_state = 2</li>
            </ul>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <h4 className="text-lg font-semibold text-blue-700 mb-2">Step 3: File Processing and Analysis</h4>
            <p className="text-gray-700 mb-2"><strong>Purpose:</strong> AI-powered file analysis</p>
            <p className="text-gray-700"><strong>Key Actions:</strong></p>
            <ul className="list-disc pl-6 mt-2 text-gray-700">
              <li>Trigger file-analysis edge function</li>
              <li>Process images through n8n workflows</li>
              <li>Generate image descriptions and insights</li>
              <li>Track progress with real-time updates</li>
            </ul>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <h4 className="text-lg font-semibold text-blue-700 mb-2">Step 4: Review and Edit Notes</h4>
            <p className="text-gray-700 mb-2"><strong>Purpose:</strong> Content creation and refinement</p>
            <p className="text-gray-700"><strong>Key Actions:</strong></p>
            <ul className="list-disc pl-6 mt-2 text-gray-700">
              <li>Review template notes populated from Step 1</li>
              <li>Add custom notes and observations</li>
              <li>Link notes to related files</li>
              <li>Incorporate AI analysis results</li>
            </ul>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <h4 className="text-lg font-semibold text-blue-700 mb-2">Step 5: Write Report</h4>
            <p className="text-gray-700 mb-2"><strong>Purpose:</strong> AI-assisted report generation</p>
            <p className="text-gray-700"><strong>Key Actions:</strong></p>
            <ul className="list-disc pl-6 mt-2 text-gray-700">
              <li>Initiate report generation process</li>
              <li>Send project data to n8n report generation workflow</li>
              <li>Monitor generation progress in real-time</li>
              <li>Create initial report structure</li>
            </ul>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <h4 className="text-lg font-semibold text-blue-700 mb-2">Step 6: View and Edit Report</h4>
            <p className="text-gray-700 mb-2"><strong>Purpose:</strong> Final review and customization</p>
            <p className="text-gray-700"><strong>Key Actions:</strong></p>
            <ul className="list-disc pl-6 mt-2 text-gray-700">
              <li>Review generated report content</li>
              <li>Edit report using rich text editor</li>
              <li>Export report in various formats</li>
              <li>Finalize and publish report</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="database" className="bg-white border rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-4 border-blue-600 pb-2">Database Schema</h2>
        
        <h3 className="text-2xl font-semibold mb-4 text-gray-800">Core Tables</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white border border-gray-300 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Table</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Purpose</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Key Columns</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">projects</td>
                <td className="border border-gray-300 px-4 py-3">Main project entity</td>
                <td className="border border-gray-300 px-4 py-3">id, name, description, user_id, template_id, status</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">files</td>
                <td className="border border-gray-300 px-4 py-3">File storage metadata</td>
                <td className="border border-gray-300 px-4 py-3">id, name, file_path, type, project_id, position</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">notes</td>
                <td className="border border-gray-300 px-4 py-3">Project notes and content</td>
                <td className="border border-gray-300 px-4 py-3">id, title, content, analysis, project_id, position</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">reports</td>
                <td className="border border-gray-300 px-4 py-3">Generated reports</td>
                <td className="border border-gray-300 px-4 py-3">id, title, content, status, project_id, template_id</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">templates</td>
                <td className="border border-gray-300 px-4 py-3">Report templates</td>
                <td className="border border-gray-300 px-4 py-3">id, name, description, modules, is_default, domain_id</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">project_workflow</td>
                <td className="border border-gray-300 px-4 py-3">Workflow state tracking</td>
                <td className="border border-gray-300 px-4 py-3">id, project_id, user_id, workflow_state</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="api-integrations" className="bg-white border rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-4 border-blue-600 pb-2">API Integrations & External Services</h2>
        
        <h3 className="text-2xl font-semibold mb-4 text-gray-800">n8n Workflow Integration</h3>
        <p className="text-gray-700 mb-6">
          QuantaReport integrates with n8n workflows for AI-powered processing and report generation. The integration uses a centralized webhook proxy system to manage different environments and workflow types.
        </p>
        
        <h4 className="text-xl font-semibold mb-4 text-gray-800">Webhook Management</h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white border border-gray-300 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Service</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Purpose</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Environments</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">n8n-webhook-proxy</td>
                <td className="border border-gray-300 px-4 py-3">Centralized webhook management</td>
                <td className="border border-gray-300 px-4 py-3">Development, Staging, Production</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">file-analysis</td>
                <td className="border border-gray-300 px-4 py-3">Image and document processing</td>
                <td className="border border-gray-300 px-4 py-3">Test and Production modes</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">report-generator</td>
                <td className="border border-gray-300 px-4 py-3">AI report generation</td>
                <td className="border border-gray-300 px-4 py-3">Test and Production modes</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-2xl font-semibold mb-4 mt-8 text-gray-800">Supabase Edge Functions</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white border border-gray-300 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Function</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Purpose</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Trigger</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">file-analysis</td>
                <td className="border border-gray-300 px-4 py-3">Process uploaded files through AI workflows</td>
                <td className="border border-gray-300 px-4 py-3">Step 3 workflow or manual trigger</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">report-generator</td>
                <td className="border border-gray-300 px-4 py-3">Generate reports using AI and templates</td>
                <td className="border border-gray-300 px-4 py-3">Step 5 workflow</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">report-progress</td>
                <td className="border border-gray-300 px-4 py-3">Track and update generation progress</td>
                <td className="border border-gray-300 px-4 py-3">Webhook callbacks from n8n</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="deployment" className="bg-white border rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-4 border-blue-600 pb-2">Deployment & Configuration</h2>
        
        <h3 className="text-2xl font-semibold mb-4 text-gray-800">Environment Setup</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white border border-gray-300 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Environment</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Purpose</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Database</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">Development</td>
                <td className="border border-gray-300 px-4 py-3">Local development and testing</td>
                <td className="border border-gray-300 px-4 py-3">Supabase project: vtaufnxworztolfdwlll</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">Staging</td>
                <td className="border border-gray-300 px-4 py-3">Pre-production testing</td>
                <td className="border border-gray-300 px-4 py-3">Separate Supabase project</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">Production</td>
                <td className="border border-gray-300 px-4 py-3">Live application</td>
                <td className="border border-gray-300 px-4 py-3">Production Supabase project</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-2xl font-semibold mb-4 mt-8 text-gray-800">Key Configuration Files</h3>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li><strong>supabase/config.toml:</strong> Supabase project configuration and edge function settings</li>
          <li><strong>src/integrations/supabase/client.ts:</strong> Supabase client initialization</li>
          <li><strong>src/utils/webhookConfig.ts:</strong> Webhook URL configuration and environment detection</li>
          <li><strong>package.json:</strong> Dependencies and build scripts</li>
          <li><strong>tailwind.config.js:</strong> Tailwind CSS customization</li>
        </ul>

        <h3 className="text-2xl font-semibold mb-4 mt-8 text-gray-800">Security Considerations</h3>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li><strong>Row Level Security:</strong> All tables implement RLS for multi-tenant data isolation</li>
          <li><strong>JWT Verification:</strong> Edge functions can optionally verify JWT tokens</li>
          <li><strong>Domain Isolation:</strong> Users are isolated by domain_id in profiles table</li>
          <li><strong>Role-based Access:</strong> Admin, user, and domain-specific role management</li>
          <li><strong>File Access Control:</strong> Secure file storage with access policies</li>
        </ul>
      </section>

      <footer className="text-center mt-12 pt-8 border-t border-gray-200 text-gray-500">
        <p>QuantaReport Technical Documentation - Generated: {new Date().toLocaleDateString()}</p>
        <p>Professional Report Creation Platform</p>
      </footer>
    </div>
  );
};

export default DocumentationTab;
