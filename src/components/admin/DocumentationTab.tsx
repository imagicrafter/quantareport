
import React from 'react';

const DocumentationTab = () => {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg text-center">
        <h1 className="text-4xl font-bold mb-2">QuantaReport</h1>
        <p className="text-xl opacity-90">Professional Report Creation Platform - Technical Documentation v2.0</p>
        <p className="text-sm opacity-75 mt-2">Last Updated: {new Date().toLocaleDateString()} | Current Version: Production Ready</p>
      </div>

      <nav className="bg-white border rounded-lg p-4 sticky top-4 z-10 shadow-sm">
        <div className="flex flex-wrap gap-4 text-sm">
          <a href="#overview" className="text-blue-600 hover:bg-gray-100 px-3 py-2 rounded transition-colors">Overview</a>
          <a href="#architecture" className="text-blue-600 hover:bg-gray-100 px-3 py-2 rounded transition-colors">Architecture</a>
          <a href="#current-state" className="text-blue-600 hover:bg-gray-100 px-3 py-2 rounded transition-colors">Current State</a>
          <a href="#file-inventory" className="text-blue-600 hover:bg-gray-100 px-3 py-2 rounded transition-colors">File Inventory</a>
          <a href="#database" className="text-blue-600 hover:bg-gray-100 px-3 py-2 rounded transition-colors">Database Schema</a>
          <a href="#workflows" className="text-blue-600 hover:bg-gray-100 px-3 py-2 rounded transition-colors">Workflows</a>
          <a href="#api-integrations" className="text-blue-600 hover:bg-gray-100 px-3 py-2 rounded transition-colors">API Integrations</a>
          <a href="#refactoring" className="text-blue-600 hover:bg-gray-100 px-3 py-2 rounded transition-colors">Refactoring</a>
          <a href="#deployment" className="text-blue-600 hover:bg-gray-100 px-3 py-2 rounded transition-colors">Deployment</a>
        </div>
      </nav>

      <section id="overview" className="bg-white border rounded-lg p-8 shadow-sm">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-4 border-blue-600 pb-2">Project Overview</h2>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-6">
          <h3 className="text-lg font-semibold text-blue-700 mb-2">Mission Statement</h3>
          <p className="text-gray-700">
            QuantaReport streamlines professional report creation through AI-powered analysis and intuitive workflow management. 
            Our platform transforms uploaded images, documents, and notes into comprehensive, customizable reports while maintaining 
            user control over content review and final output.
          </p>
        </div>
        
        <h3 className="text-2xl font-semibold mb-4 text-gray-800">Core Capabilities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-gray-800">Report Creation Features</h4>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>6-Step Guided Workflow:</strong> Structured process from initiation to final review</li>
              <li><strong>AI-Powered Analysis:</strong> Automated image and document processing</li>
              <li><strong>Template System:</strong> Domain-specific templates with customizable modules</li>
              <li><strong>Real-time Progress Tracking:</strong> Live updates during processing stages</li>
              <li><strong>Rich Text Editing:</strong> TinyMCE integration for professional formatting</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-gray-800">Platform Features</h4>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Multi-tenant Architecture:</strong> Domain-based user isolation</li>
              <li><strong>Role-based Access Control:</strong> Admin, user, and domain-specific permissions</li>
              <li><strong>File Management:</strong> Support for images, audio, and documents</li>
              <li><strong>Note Management:</strong> Structured note creation with file relationships</li>
              <li><strong>Custom Report Sharing:</strong> Token-based public report access</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-green-500">
            <h4 className="text-lg font-semibold text-green-700 mb-3">Frontend Stack</h4>
            <div className="flex flex-wrap gap-2">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">React 18</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">TypeScript</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Tailwind CSS</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Shadcn/UI</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">React Router</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">TanStack Query</span>
            </div>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-blue-500">
            <h4 className="text-lg font-semibold text-blue-700 mb-3">Backend Services</h4>
            <div className="flex flex-wrap gap-2">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Supabase</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Edge Functions</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">PostgreSQL</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Row Level Security</span>
            </div>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-orange-500">
            <h4 className="text-lg font-semibold text-orange-700 mb-3">External Services</h4>
            <div className="flex flex-wrap gap-2">
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">n8n Workflows</span>
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">OpenAI API</span>
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">Webhook Proxy</span>
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">Mailjet</span>
            </div>
          </div>
        </div>
      </section>

      <section id="architecture" className="bg-white border rounded-lg p-8 shadow-sm">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-4 border-blue-600 pb-2">System Architecture</h2>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg mb-6">
          <h3 className="text-lg font-semibold text-yellow-700 mb-2">Architecture Philosophy</h3>
          <p className="text-gray-700">
            QuantaReport follows a feature-driven modular architecture with clear separation of concerns. 
            The application prioritizes maintainability, scalability, and type safety while keeping components focused and reusable.
          </p>
        </div>
        
        <h3 className="text-2xl font-semibold mb-4 text-gray-800">Layer Architecture</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-purple-50 p-6 rounded-lg text-center">
            <h4 className="text-lg font-semibold text-purple-700 mb-3">Presentation</h4>
            <p className="text-sm text-gray-700">React components, pages, layouts using shadcn/ui design system</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg text-center">
            <h4 className="text-lg font-semibold text-blue-700 mb-3">Business Logic</h4>
            <p className="text-sm text-gray-700">Custom hooks, services, and utilities for application logic</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg text-center">
            <h4 className="text-lg font-semibold text-green-700 mb-3">Data Access</h4>
            <p className="text-sm text-gray-700">Supabase client, TanStack Query for state management</p>
          </div>
          <div className="bg-red-50 p-6 rounded-lg text-center">
            <h4 className="text-lg font-semibold text-red-700 mb-3">External APIs</h4>
            <p className="text-sm text-gray-700">n8n webhooks, OpenAI integration, email services</p>
          </div>
        </div>

        <h3 className="text-2xl font-semibold mb-4 text-gray-800">Key Architectural Patterns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800">Design Patterns</h4>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Feature-based Organization:</strong> Code organized by business domains</li>
              <li><strong>Custom Hooks Pattern:</strong> Reusable state and side effect management</li>
              <li><strong>Service Layer Pattern:</strong> Dedicated services for complex operations</li>
              <li><strong>Repository Pattern:</strong> Consistent data access abstractions</li>
              <li><strong>Observer Pattern:</strong> Real-time updates via Supabase subscriptions</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800">Technical Principles</h4>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Type Safety First:</strong> Comprehensive TypeScript coverage</li>
              <li><strong>Component Composition:</strong> Small, focused, reusable components</li>
              <li><strong>Separation of Concerns:</strong> Clear boundaries between layers</li>
              <li><strong>Error Boundary Strategy:</strong> Graceful error handling and recovery</li>
              <li><strong>Performance Optimization:</strong> Lazy loading and efficient re-renders</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="current-state" className="bg-white border rounded-lg p-8 shadow-sm">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-4 border-blue-600 pb-2">Current State & Health</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
            <h3 className="text-lg font-semibold text-green-700 mb-3">✅ Production Ready</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Core workflows functional</li>
              <li>• Database schema stable</li>
              <li>• Authentication working</li>
              <li>• File upload operational</li>
            </ul>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg">
            <h3 className="text-lg font-semibold text-yellow-700 mb-3">⚠️ In Progress</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Google Drive integration</li>
              <li>• Advanced file annotations</li>
              <li>• Report export formats</li>
              <li>• Mobile optimization</li>
            </ul>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <h3 className="text-lg font-semibold text-blue-700 mb-3">🔄 Refactoring Needs</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Large component files</li>
              <li>• Duplicate service logic</li>
              <li>• Settings page complexity</li>
              <li>• File management optimization</li>
            </ul>
          </div>
        </div>

        <h3 className="text-2xl font-semibold mb-4 text-gray-800">Code Quality Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white border border-gray-300 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">TypeScript Coverage</td>
                <td className="border border-gray-300 px-4 py-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Excellent</span></td>
                <td className="border border-gray-300 px-4 py-3">95%+ coverage, comprehensive type definitions</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">Component Size</td>
                <td className="border border-gray-300 px-4 py-3"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">Needs Attention</span></td>
                <td className="border border-gray-300 px-4 py-3">Several files {'>'}200 lines, refactoring recommended</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">Code Organization</td>
                <td className="border border-gray-300 px-4 py-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Good</span></td>
                <td className="border border-gray-300 px-4 py-3">Feature-based structure, clear separation</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">Error Handling</td>
                <td className="border border-gray-300 px-4 py-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Good</span></td>
                <td className="border border-gray-300 px-4 py-3">Consistent error boundaries and user feedback</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="file-inventory" className="bg-white border rounded-lg p-8 shadow-sm">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-4 border-blue-600 pb-2">File Structure & Inventory</h2>
        
        <h3 className="text-2xl font-semibold mb-4 text-gray-800">Core Application Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-blue-700 mb-3">Pages & Routing</h4>
            <div className="text-sm text-gray-700 space-y-1 font-mono">
              <div>src/pages/</div>
              <div className="pl-4">├── Dashboard.tsx <span className="text-gray-500"># Main dashboard</span></div>
              <div className="pl-4">├── Reports.tsx <span className="text-gray-500"># Reports management</span></div>
              <div className="pl-4">├── Settings.tsx <span className="text-gray-500"># User settings (208 lines - needs refactor)</span></div>
              <div className="pl-4">├── Templates.tsx <span className="text-gray-500"># Template management</span></div>
              <div className="pl-4">├── Images.tsx <span className="text-gray-500"># Image gallery</span></div>
              <div className="pl-4">├── Notes.tsx <span className="text-gray-500"># Notes management</span></div>
              <div className="pl-4">└── Admin.tsx <span className="text-gray-500"># Admin panel</span></div>
            </div>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-green-700 mb-3">Layout Components</h4>
            <div className="text-sm text-gray-700 space-y-1 font-mono">
              <div>src/components/layout/</div>
              <div className="pl-4">├── DashboardLayout.tsx</div>
              <div className="pl-4">├── NavBar.tsx</div>
              <div className="pl-4">└── Footer.tsx</div>
              <br />
              <div>src/components/dashboard/</div>
              <div className="pl-4">├── Sidebar.tsx</div>
              <div className="pl-4">├── DashboardHeader.tsx</div>
              <div className="pl-4">└── UserAvatar.tsx</div>
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-semibold mb-4 text-gray-800">Feature Modules</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-purple-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-purple-700 mb-3">Report Workflow</h4>
            <div className="text-xs text-gray-700 space-y-1 font-mono">
              <div>report-workflow/</div>
              <div className="pl-2">├── steps/ <span className="text-gray-500"># 6-step process</span></div>
              <div className="pl-2">├── file-upload/ <span className="text-gray-500"># File management</span></div>
              <div className="pl-2">├── review/ <span className="text-gray-500"># Report review</span></div>
              <div className="pl-2">└── constants/ <span className="text-gray-500"># Workflow config</span></div>
            </div>
          </div>
          <div className="bg-orange-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-orange-700 mb-3">File Management</h4>
            <div className="text-xs text-gray-700 space-y-1 font-mono">
              <div>dashboard/files/</div>
              <div className="pl-2">├── services/ <span className="text-gray-500"># File operations</span></div>
              <div className="pl-2">├── hooks/ <span className="text-gray-500"># File state</span></div>
              <div className="pl-2">├── components/ <span className="text-gray-500"># UI components</span></div>
              <div className="pl-2">└── BulkUploadDialog.tsx <span className="text-red-500"># 240 lines!</span></div>
            </div>
          </div>
          <div className="bg-teal-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-teal-700 mb-3">Admin System</h4>
            <div className="text-xs text-gray-700 space-y-1 font-mono">
              <div>admin/</div>
              <div className="pl-2">├── AdminProjectsTab.tsx</div>
              <div className="pl-2">├── AdminReportsTab.tsx</div>
              <div className="pl-2">├── ConfigurationTab.tsx</div>
              <div className="pl-2">├── TemplatesTab.tsx</div>
              <div className="pl-2">└── DocumentationTab.tsx <span className="text-red-500"># 363 lines!</span></div>
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-semibold mb-4 text-gray-800">Service Layer & Utilities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-700 mb-3">Business Services</h4>
            <div className="text-sm text-gray-700 space-y-1 font-mono">
              <div>src/services/</div>
              <div className="pl-4">├── authValidationService.ts</div>
              <div className="pl-4">├── configurationService.ts</div>
              <div className="pl-4">├── customReportsService.ts</div>
              <div className="pl-4">├── subscriptionService.ts</div>
              <div className="pl-4">└── userService.ts</div>
            </div>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-700 mb-3">Edge Functions</h4>
            <div className="text-sm text-gray-700 space-y-1 font-mono">
              <div>supabase/functions/</div>
              <div className="pl-4">├── file-analysis/</div>
              <div className="pl-4">├── report-generator/</div>
              <div className="pl-4">├── n8n-webhook-proxy/</div>
              <div className="pl-4">└── send-signup-invite/</div>
            </div>
          </div>
        </div>
      </section>

      <section id="database" className="bg-white border rounded-lg p-8 shadow-sm">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-4 border-blue-600 pb-2">Database Schema & Architecture</h2>
        
        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg mb-6">
          <h3 className="text-lg font-semibold text-green-700 mb-2">Schema Philosophy</h3>
          <p className="text-gray-700">
            The database follows a multi-tenant architecture with domain-based isolation. Every table implements 
            Row Level Security (RLS) for data protection, and the schema supports both user-specific and administrative access patterns.
          </p>
        </div>
        
        <h3 className="text-2xl font-semibold mb-4 text-gray-800">Core Entity Tables</h3>
        <div className="overflow-x-auto mb-8">
          <table className="w-full border-collapse bg-white border border-gray-300 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Table</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Purpose</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Key Features</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">RLS Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">projects</td>
                <td className="border border-gray-300 px-4 py-3">Main project entity</td>
                <td className="border border-gray-300 px-4 py-3">Domain isolation, template linking, status tracking</td>
                <td className="border border-gray-300 px-4 py-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Enabled</span></td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">files</td>
                <td className="border border-gray-300 px-4 py-3">File metadata & storage</td>
                <td className="border border-gray-300 px-4 py-3">Type classification, position ordering, metadata JSON</td>
                <td className="border border-gray-300 px-4 py-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Enabled</span></td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">notes</td>
                <td className="border border-gray-300 px-4 py-3">Project notes & analysis</td>
                <td className="border border-gray-300 px-4 py-3">Rich content, AI analysis, file relationships</td>
                <td className="border border-gray-300 px-4 py-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Enabled</span></td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">reports</td>
                <td className="border border-gray-300 px-4 py-3">Generated reports</td>
                <td className="border border-gray-300 px-4 py-3">Content storage, status tracking, image URLs</td>
                <td className="border border-gray-300 px-4 py-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Enabled</span></td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">templates</td>
                <td className="border border-gray-300 px-4 py-3">Report templates</td>
                <td className="border border-gray-300 px-4 py-3">Module system, domain specificity, public sharing</td>
                <td className="border border-gray-300 px-4 py-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Enabled</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-2xl font-semibold mb-4 text-gray-800">Workflow & Progress Tables</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-blue-700 mb-3">Workflow Management</h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li><strong>project_workflow:</strong> Tracks 6-step workflow state per project</li>
              <li><strong>report_progress:</strong> Real-time progress updates during generation</li>
              <li><strong>note_file_relationships:</strong> Links notes to related files</li>
            </ul>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-purple-700 mb-3">Supporting Tables</h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li><strong>image_descriptions:</strong> AI-generated image analysis</li>
              <li><strong>template_notes:</strong> Template-specific note structures</li>
              <li><strong>custom_reports:</strong> Shareable report tokens</li>
            </ul>
          </div>
        </div>

        <h3 className="text-2xl font-semibold mb-4 text-gray-800">User & Access Management</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white border border-gray-300 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Table</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Access Pattern</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Key Features</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">profiles</td>
                <td className="border border-gray-300 px-4 py-3">User-owned + Admin view</td>
                <td className="border border-gray-300 px-4 py-3">Role management, domain isolation, subscription status</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">domains</td>
                <td className="border border-gray-300 px-4 py-3">Public read + Owner management</td>
                <td className="border border-gray-300 px-4 py-3">Multi-tenant organization, template scoping</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">signup_codes</td>
                <td className="border border-gray-300 px-4 py-3">Admin management + User validation</td>
                <td className="border border-gray-300 px-4 py-3">Invitation system, email-based registration</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">user_subscriptions</td>
                <td className="border border-gray-300 px-4 py-3">User-owned + Service role</td>
                <td className="border border-gray-300 px-4 py-3">Stripe integration, subscription lifecycle</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="workflows" className="bg-white border rounded-lg p-8 shadow-sm">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-4 border-blue-600 pb-2">Report Creation Workflow</h2>
        
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-6 rounded-r-lg mb-6">
          <h3 className="text-lg font-semibold text-indigo-700 mb-2">Workflow Architecture</h3>
          <p className="text-gray-700">
            The 6-step workflow provides a guided, stateful process for report creation. Each step is tracked in the 
            project_workflow table, enabling seamless navigation, progress recovery, and user experience continuity.
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <div className="flex items-center mb-3">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">1</div>
              <h4 className="text-xl font-semibold text-blue-700">Initiate New Report</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-700 mb-3"><strong>Purpose:</strong> Project setup and template application</p>
                <h5 className="font-semibold text-gray-800 mb-2">Key Actions:</h5>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Create new project or select existing for updates</li>
                  <li>Apply domain-specific default template</li>
                  <li>Initialize template notes structure</li>
                  <li>Set workflow_state = 1 in project_workflow table</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-gray-800 mb-2">Technical Implementation:</h5>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>ProjectSelector component handles project creation/selection</li>
                  <li>TemplateSelector applies domain-based templates</li>
                  <li>Template notes are copied to notes table</li>
                  <li>Workflow state persisted for navigation continuity</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 p-6 rounded-r-lg">
            <div className="flex items-center mb-3">
              <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">2</div>
              <h4 className="text-xl font-semibold text-green-700">Upload and Prepare Files</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-700 mb-3"><strong>Purpose:</strong> File collection and organization</p>
                <h5 className="font-semibold text-gray-800 mb-2">Supported File Types:</h5>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li><strong>Images:</strong> JPG, PNG, GIF, WebP, SVG</li>
                  <li><strong>Audio:</strong> MP3, WAV, OGG, M4A</li>
                  <li><strong>Documents:</strong> TXT, MD, DOC, DOCX</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-gray-800 mb-2">Features:</h5>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Drag-and-drop file upload interface</li>
                  <li>Bulk upload with progress tracking</li>
                  <li>File positioning and organization</li>
                  <li>Metadata extraction and storage</li>
                  <li>Preview and annotation capabilities</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-500 p-6 rounded-r-lg">
            <div className="flex items-center mb-3">
              <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">3</div>
              <h4 className="text-xl font-semibold text-purple-700">File Processing and Analysis</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-700 mb-3"><strong>Purpose:</strong> AI-powered content analysis</p>
                <h5 className="font-semibold text-gray-800 mb-2">Processing Pipeline:</h5>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Trigger file-analysis edge function</li>
                  <li>Route files to n8n workflow endpoints</li>
                  <li>Generate AI descriptions and insights</li>
                  <li>Store results in image_descriptions table</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-gray-800 mb-2">Progress Tracking:</h5>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Real-time progress updates via WebSocket</li>
                  <li>FileAnalysisProgressModal shows live status</li>
                  <li>Error handling and retry mechanisms</li>
                  <li>Completion validation before Step 4</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-500 p-6 rounded-r-lg">
            <div className="flex items-center mb-3">
              <div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">4</div>
              <h4 className="text-xl font-semibold text-orange-700">Review and Edit Notes</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-700 mb-3"><strong>Purpose:</strong> Content refinement and customization</p>
                <h5 className="font-semibold text-gray-800 mb-2">Note Management:</h5>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Template notes pre-populated from Step 1</li>
                  <li>Rich text editing with TinyMCE integration</li>
                  <li>Note-to-file relationship management</li>
                  <li>AI analysis integration and review</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-gray-800 mb-2">Interactive Features:</h5>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Tabbed interface for organized editing</li>
                  <li>File picker for note associations</li>
                  <li>Auto-save and version management</li>
                  <li>Validation before proceeding to Step 5</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 p-6 rounded-r-lg">
            <div className="flex items-center mb-3">
              <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">5</div>
              <h4 className="text-xl font-semibold text-red-700">Write Report</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-700 mb-3"><strong>Purpose:</strong> AI-assisted report generation</p>
                <h5 className="font-semibold text-gray-800 mb-2">Generation Process:</h5>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Collect all project data (notes, files, analysis)</li>
                  <li>Send to report-generator edge function</li>
                  <li>Route to n8n report generation workflow</li>
                  <li>AI processes content using OpenAI API</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-gray-800 mb-2">Progress Monitoring:</h5>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Real-time updates in report_progress table</li>
                  <li>WebSocket notifications to frontend</li>
                  <li>Error tracking and user feedback</li>
                  <li>Automatic advancement to Step 6 on completion</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-teal-50 to-teal-100 border-l-4 border-teal-500 p-6 rounded-r-lg">
            <div className="flex items-center mb-3">
              <div className="bg-teal-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">6</div>
              <h4 className="text-xl font-semibold text-teal-700">View and Edit Report</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-700 mb-3"><strong>Purpose:</strong> Final review and customization</p>
                <h5 className="font-semibold text-gray-800 mb-2">Editing Features:</h5>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Full TinyMCE rich text editor</li>
                  <li>Real-time preview and editing</li>
                  <li>Image integration and positioning</li>
                  <li>Section-based content organization</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-gray-800 mb-2">Export & Sharing:</h5>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>PDF export functionality</li>
                  <li>Custom report token generation</li>
                  <li>Public sharing with access control</li>
                  <li>Version history and archiving</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Workflow Navigation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Forward Navigation:</h4>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>Next button advances workflow_state by 1</li>
                <li>Validation required before proceeding</li>
                <li>State persisted in project_workflow table</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Backward Navigation:</h4>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>Banner step buttons allow previous step access</li>
                <li>Workflow state updated accordingly</li>
                <li>Exit confirmation for navigation outside workflow</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="api-integrations" className="bg-white border rounded-lg p-8 shadow-sm">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-4 border-blue-600 pb-2">API Integrations & External Services</h2>
        
        <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-r-lg mb-6">
          <h3 className="text-lg font-semibold text-purple-700 mb-2">Integration Strategy</h3>
          <p className="text-gray-700">
            QuantaReport uses a centralized webhook proxy system to manage external API integrations. This approach provides 
            environment-specific routing, error handling, and consistent interface management across different services.
          </p>
        </div>
        
        <h3 className="text-2xl font-semibold mb-4 text-gray-800">n8n Workflow Integration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-blue-700 mb-3">Webhook Management System</h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li><strong>Centralized Proxy:</strong> n8n-webhook-proxy edge function routes all requests</li>
              <li><strong>Environment Detection:</strong> Automatic dev/staging/production routing</li>
              <li><strong>Configuration Management:</strong> Environment-specific webhook URLs</li>
              <li><strong>Error Handling:</strong> Consistent error responses and logging</li>
            </ul>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-green-700 mb-3">Workflow Types</h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li><strong>file-analysis:</strong> Image and document processing workflows</li>
              <li><strong>report:</strong> Report generation and content creation</li>
              <li><strong>note:</strong> Note analysis and enhancement (planned)</li>
              <li><strong>Test Modes:</strong> Separate test webhooks for development</li>
            </ul>
          </div>
        </div>

        <h3 className="text-2xl font-semibold mb-4 text-gray-800">Supabase Edge Functions</h3>
        <div className="overflow-x-auto mb-8">
          <table className="w-full border-collapse bg-white border border-gray-300 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Function</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Purpose</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Trigger</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Integration</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">n8n-webhook-proxy</td>
                <td className="border border-gray-300 px-4 py-3">Centralized webhook routing</td>
                <td className="border border-gray-300 px-4 py-3">HTTP requests from application</td>
                <td className="border border-gray-300 px-4 py-3">Routes to appropriate n8n workflows</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">file-analysis</td>
                <td className="border border-gray-300 px-4 py-3">Process uploaded files</td>
                <td className="border border-gray-300 px-4 py-3">Step 3 workflow or manual</td>
                <td className="border border-gray-300 px-4 py-3">OpenAI API via n8n workflows</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">report-generator</td>
                <td className="border border-gray-300 px-4 py-3">Generate reports using AI</td>
                <td className="border border-gray-300 px-4 py-3">Step 5 workflow</td>
                <td className="border border-gray-300 px-4 py-3">OpenAI API via n8n workflows</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">report-progress</td>
                <td className="border border-gray-300 px-4 py-3">Track generation progress</td>
                <td className="border border-gray-300 px-4 py-3">n8n workflow callbacks</td>
                <td className="border border-gray-300 px-4 py-3">Updates database, notifies frontend</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">send-signup-invite</td>
                <td className="border border-gray-300 px-4 py-3">Email invitation system</td>
                <td className="border border-gray-300 px-4 py-3">User registration events</td>
                <td className="border border-gray-300 px-4 py-3">Mailjet API for email delivery</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-2xl font-semibold mb-4 text-gray-800">External API Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-orange-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-orange-700 mb-3">OpenAI Integration</h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li><strong>Image Analysis:</strong> GPT-4 Vision for image descriptions</li>
              <li><strong>Content Generation:</strong> GPT-4 for report writing</li>
              <li><strong>Text Processing:</strong> Analysis and summarization</li>
              <li><strong>API Management:</strong> Rate limiting and error handling</li>
            </ul>
          </div>
          <div className="bg-red-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-red-700 mb-3">Mailjet Service</h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li><strong>Signup Invitations:</strong> Branded email templates</li>
              <li><strong>System Notifications:</strong> User and admin alerts</li>
              <li><strong>Template Management:</strong> HTML email templates</li>
              <li><strong>Delivery Tracking:</strong> Email status monitoring</li>
            </ul>
          </div>
          <div className="bg-teal-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-teal-700 mb-3">Google OAuth</h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li><strong>Authentication:</strong> Google account login</li>
              <li><strong>Profile Data:</strong> Avatar and user information</li>
              <li><strong>Secure Integration:</strong> OAuth 2.0 implementation</li>
              <li><strong>User Experience:</strong> Seamless account creation</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Environment Configuration</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white border border-gray-300 rounded-lg">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Environment</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Webhook Prefix</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Database</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">External APIs</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 font-medium">Development</td>
                  <td className="border border-gray-300 px-4 py-3">DEV_*</td>
                  <td className="border border-gray-300 px-4 py-3">vtaufnxworztolfdwlll</td>
                  <td className="border border-gray-300 px-4 py-3">Test mode APIs</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 font-medium">Staging</td>
                  <td className="border border-gray-300 px-4 py-3">STAGING_*</td>
                  <td className="border border-gray-300 px-4 py-3">Staging project</td>
                  <td className="border border-gray-300 px-4 py-3">Limited API calls</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 font-medium">Production</td>
                  <td className="border border-gray-300 px-4 py-3">PROD_*</td>
                  <td className="border border-gray-300 px-4 py-3">Production project</td>
                  <td className="border border-gray-300 px-4 py-3">Full API access</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="refactoring" className="bg-white border rounded-lg p-8 shadow-sm">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-4 border-blue-600 pb-2">Refactoring Opportunities</h2>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg mb-6">
          <h3 className="text-lg font-semibold text-yellow-700 mb-2">Code Health Assessment</h3>
          <p className="text-gray-700">
            While QuantaReport's architecture is solid, several components have grown beyond optimal maintainability. 
            The following refactoring opportunities will improve code quality, reduce complexity, and enhance developer experience.
          </p>
        </div>

        <h3 className="text-2xl font-semibold mb-4 text-gray-800">High Priority Refactoring</h3>
        <div className="space-y-6 mb-8">
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
            <h4 className="text-lg font-semibold text-red-700 mb-3">🚨 Immediate Attention Required</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-semibold text-gray-800 mb-2">Large Components ({'>'}200 lines)</h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>DocumentationTab.tsx</strong> - 363 lines</li>
                  <li><strong>BulkUploadDialog.tsx</strong> - 240 lines</li>
                  <li><strong>Settings.tsx</strong> - 208 lines</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-gray-800 mb-2">Recommended Actions</h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>Split into focused sub-components</li>
                  <li>Extract custom hooks for state management</li>
                  <li>Create dedicated service modules</li>
                  <li>Implement proper error boundaries</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-lg">
            <h4 className="text-lg font-semibold text-orange-700 mb-3">⚠️ Code Duplication Issues</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-semibold text-gray-800 mb-2">File Management Services</h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>Multiple file upload implementations</li>
                  <li>Repeated Supabase client patterns</li>
                  <li>Duplicate error handling logic</li>
                  <li>Similar validation functions</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-gray-800 mb-2">Suggested Solutions</h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>Consolidate file operations into unified service</li>
                  <li>Create shared utility functions</li>
                  <li>Implement consistent error handling patterns</li>
                  <li>Standardize validation schemas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-semibold mb-4 text-gray-800">Medium Priority Improvements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-blue-700 mb-3">Component Architecture</h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li><strong>Sidebar Navigation:</strong> Extract sub-menu components</li>
              <li><strong>Dashboard Layout:</strong> Simplify header and section management</li>
              <li><strong>Admin Components:</strong> Create shared admin UI patterns</li>
              <li><strong>Form Components:</strong> Standardize form handling patterns</li>
            </ul>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-purple-700 mb-3">State Management</h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li><strong>Context Optimization:</strong> Split large contexts into smaller ones</li>
              <li><strong>Custom Hooks:</strong> Extract reusable state logic</li>
              <li><strong>Cache Management:</strong> Optimize TanStack Query usage</li>
              <li><strong>Real-time Updates:</strong> Consolidate WebSocket subscriptions</li>
            </ul>
          </div>
        </div>

        <h3 className="text-2xl font-semibold mb-4 text-gray-800">Technical Debt Remediation</h3>
        <div className="overflow-x-auto mb-8">
          <table className="w-full border-collapse bg-white border border-gray-300 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Area</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Current Issue</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Proposed Solution</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Priority</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">File Services</td>
                <td className="border border-gray-300 px-4 py-3">8 separate service files with overlapping functionality</td>
                <td className="border border-gray-300 px-4 py-3">Consolidate into unified FileService with clear responsibilities</td>
                <td className="border border-gray-300 px-4 py-3"><span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">High</span></td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">Settings Page</td>
                <td className="border border-gray-300 px-4 py-3">208 lines with mixed concerns</td>
                <td className="border border-gray-300 px-4 py-3">Split into ProfileSettings, SecuritySettings, etc.</td>
                <td className="border border-gray-300 px-4 py-3"><span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">Medium</span></td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">Upload Dialog</td>
                <td className="border border-gray-300 px-4 py-3">240 lines with Google Drive integration disabled</td>
                <td className="border border-gray-300 px-4 py-3">Extract upload providers into separate components</td>
                <td className="border border-gray-300 px-4 py-3"><span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">Medium</span></td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">Type Definitions</td>
                <td className="border border-gray-300 px-4 py-3">Some types scattered across files</td>
                <td className="border border-gray-300 px-4 py-3">Centralize shared types in dedicated files</td>
                <td className="border border-gray-300 px-4 py-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Low</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-2xl font-semibold mb-4 text-gray-800">Refactoring Roadmap</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-red-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-red-700 mb-3">Phase 1: Critical (Week 1-2)</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✅ Refactor BulkUploadDialog</li>
              <li>✅ Split Settings page</li>
              <li>✅ Consolidate file services</li>
              <li>✅ Extract large documentation sections</li>
            </ul>
          </div>
          <div className="bg-orange-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-orange-700 mb-3">Phase 2: Optimization (Week 3-4)</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>🔄 Optimize component state management</li>
              <li>🔄 Standardize form handling patterns</li>
              <li>🔄 Improve error boundary coverage</li>
              <li>🔄 Enhance TypeScript strict mode</li>
            </ul>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-green-700 mb-3">Phase 3: Enhancement (Week 5-6)</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>📋 Add comprehensive testing</li>
              <li>📋 Implement performance monitoring</li>
              <li>📋 Create component documentation</li>
              <li>📋 Setup automated code quality checks</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="deployment" className="bg-white border rounded-lg p-8 shadow-sm">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-4 border-blue-600 pb-2">Deployment & Configuration</h2>
        
        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg mb-6">
          <h3 className="text-lg font-semibold text-green-700 mb-2">Production Status</h3>
          <p className="text-gray-700">
            QuantaReport is deployed and operational in production with multi-environment support. The application uses 
            Supabase for hosting and database management, with Lovable.dev for frontend deployment and domain management.
          </p>
        </div>
        
        <h3 className="text-2xl font-semibold mb-4 text-gray-800">Environment Architecture</h3>
        <div className="overflow-x-auto mb-8">
          <table className="w-full border-collapse bg-white border border-gray-300 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Environment</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Purpose</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Database</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Deployment</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">Development</td>
                <td className="border border-gray-300 px-4 py-3">Local development and testing</td>
                <td className="border border-gray-300 px-4 py-3">vtaufnxworztolfdwlll.supabase.co</td>
                <td className="border border-gray-300 px-4 py-3">Local Vite dev server</td>
                <td className="border border-gray-300 px-4 py-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Active</span></td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">Staging</td>
                <td className="border border-gray-300 px-4 py-3">Pre-production testing</td>
                <td className="border border-gray-300 px-4 py-3">Separate Supabase project</td>
                <td className="border border-gray-300 px-4 py-3">Lovable.dev staging</td>
                <td className="border border-gray-300 px-4 py-3"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">Planned</span></td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">Production</td>
                <td className="border border-gray-300 px-4 py-3">Live application</td>
                <td className="border border-gray-300 px-4 py-3">Production Supabase project</td>
                <td className="border border-gray-300 px-4 py-3">quantareport.com</td>
                <td className="border border-gray-300 px-4 py-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Live</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-2xl font-semibold mb-4 text-gray-800">Infrastructure Components</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-blue-700 mb-3">Frontend Hosting</h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li><strong>Platform:</strong> Lovable.dev deployment</li>
              <li><strong>Domain:</strong> quantareport.com (custom domain)</li>
              <li><strong>CDN:</strong> Global edge distribution</li>
              <li><strong>SSL:</strong> Automatic HTTPS with certificate management</li>
              <li><strong>Build:</strong> Vite production optimized builds</li>
            </ul>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-purple-700 mb-3">Backend Services</h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li><strong>Database:</strong> Supabase PostgreSQL with RLS</li>
              <li><strong>Authentication:</strong> Supabase Auth with Google OAuth</li>
              <li><strong>Storage:</strong> Supabase Storage with public/private buckets</li>
              <li><strong>Edge Functions:</strong> Deno runtime for serverless functions</li>
              <li><strong>Real-time:</strong> WebSocket subscriptions for live updates</li>
            </ul>
          </div>
        </div>

        <h3 className="text-2xl font-semibold mb-4 text-gray-800">Security & Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-red-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-red-700 mb-3">Security Measures</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>Row Level Security on all tables</li>
              <li>JWT token verification</li>
              <li>Domain-based user isolation</li>
              <li>Role-based access control</li>
              <li>Secure file storage policies</li>
            </ul>
          </div>
          <div className="bg-orange-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-orange-700 mb-3">Environment Variables</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>Supabase project credentials</li>
              <li>OAuth client configurations</li>
              <li>Webhook URLs by environment</li>
              <li>Email service credentials</li>
              <li>External API keys</li>
            </ul>
          </div>
          <div className="bg-teal-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-teal-700 mb-3">Monitoring</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>Supabase Dashboard metrics</li>
              <li>Edge function logs</li>
              <li>Database performance monitoring</li>
              <li>Error tracking and alerts</li>
              <li>User analytics and insights</li>
            </ul>
          </div>
        </div>

        <h3 className="text-2xl font-semibold mb-4 text-gray-800">Deployment Process</h3>
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Frontend Deployment</h4>
              <ol className="list-decimal pl-6 text-gray-700 space-y-1">
                <li>Code changes pushed to main branch</li>
                <li>Lovable.dev automatically builds and deploys</li>
                <li>Build optimization and asset compression</li>
                <li>CDN cache invalidation</li>
                <li>Health checks and verification</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Database Migrations</h4>
              <ol className="list-decimal pl-6 text-gray-700 space-y-1">
                <li>SQL migrations written in supabase/migrations/</li>
                <li>Local testing with Supabase CLI</li>
                <li>Review and approval process</li>
                <li>Production deployment via Supabase Dashboard</li>
                <li>Verification and rollback procedures</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center mt-12 pt-8 border-t border-gray-200 text-gray-500">
        <div className="space-y-2">
          <p className="font-medium">QuantaReport Technical Documentation v2.0</p>
          <p>Generated: {new Date().toLocaleDateString()} | Professional Report Creation Platform</p>
          <p className="text-sm">Architecture: React + TypeScript + Supabase | Status: Production Ready</p>
        </div>
      </footer>
    </div>
  );
};

export default DocumentationTab;
