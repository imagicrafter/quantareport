
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu, X, Plus, Upload, FolderPlus, Settings, LogOut, User, Image, FileText, FileCheck, FileArchive } from 'lucide-react';
import Button from '../components/ui-elements/Button';
import Logo from '../components/ui-elements/Logo';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  
  const projects = [
    { id: '1', name: 'Site Inspection Report', date: '2023-05-15', imageCount: 12, reportStatus: 'completed' },
    { id: '2', name: 'Property Damage Assessment', date: '2023-06-22', imageCount: 8, reportStatus: 'draft' },
    { id: '3', name: 'Construction Progress', date: '2023-07-10', imageCount: 24, reportStatus: 'processing' },
  ];
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen flex bg-secondary/30">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
            <Logo variant="default" />
            <button 
              onClick={toggleSidebar}
              className="p-1 rounded-md hover:bg-sidebar-accent md:hidden"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-4">
            <button 
              onClick={() => setShowCreateProject(true)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-md py-2 px-4 flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={18} />
              <span>New Project</span>
            </button>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            <div className="space-y-1">
              {[
                { name: 'Projects', icon: <FolderPlus size={20} />, path: '/dashboard' },
                { name: 'Images', icon: <Image size={20} />, path: '/dashboard/images' },
                { name: 'Notes', icon: <FileText size={20} />, path: '/dashboard/notes' },
                { name: 'Templates', icon: <FileCheck size={20} />, path: '/dashboard/templates' },
                { name: 'Reports', icon: <FileArchive size={20} />, path: '/dashboard/reports' },
              ].map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${
                    item.path === '/dashboard' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </nav>
          
          <div className="border-t border-sidebar-border p-4 space-y-2">
            <Link
              to="/dashboard/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <Settings size={20} />
              <span>Settings</span>
            </Link>
            <button 
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <LogOut size={20} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
          <div className="px-4 md:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleSidebar}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground md:hidden"
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-xl font-semibold">Projects</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative hidden md:flex">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  type="search" 
                  placeholder="Search projects..."
                  className="pl-10 pr-4 py-2 rounded-md border border-input bg-background w-64"
                />
              </div>
              
              <button className="p-1 rounded-full bg-secondary/50 hover:bg-secondary transition-colors">
                <User size={24} className="text-muted-foreground" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className="glass-card p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <FolderPlus size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-1">Projects</h3>
              <p className="text-2xl font-semibold">{projects.length}</p>
            </div>
            
            <div className="glass-card p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Image size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-1">Images</h3>
              <p className="text-2xl font-semibold">44</p>
            </div>
            
            <div className="glass-card p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <FileArchive size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-1">Reports</h3>
              <p className="text-2xl font-semibold">3</p>
            </div>
          </div>
          
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Recent Projects</h2>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                icon={<Upload size={16} />}
              >
                Import
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                icon={<Plus size={16} />}
                onClick={() => setShowCreateProject(true)}
              >
                New Project
              </Button>
            </div>
          </div>
          
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Date Created</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Images</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="border-b border-border hover:bg-secondary/40 transition-colors">
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-medium">{project.name}</div>
                      </td>
                      <td className="p-4 whitespace-nowrap text-muted-foreground">
                        {new Date(project.date).toLocaleDateString()}
                      </td>
                      <td className="p-4 whitespace-nowrap text-muted-foreground">
                        {project.imageCount}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          project.reportStatus === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : project.reportStatus === 'processing' 
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {project.reportStatus.charAt(0).toUpperCase() + project.reportStatus.slice(1)}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap text-right">
                        <Link to={`/dashboard/projects/${project.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      
      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Create New Project</h2>
              <button 
                onClick={() => setShowCreateProject(false)}
                className="p-1 rounded-full hover:bg-secondary/70"
              >
                <X size={20} />
              </button>
            </div>
            
            <form className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="projectName" className="text-sm font-medium">
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  className="w-full p-2 rounded-md border border-input bg-background"
                  placeholder="Enter project name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="industry" className="text-sm font-medium">
                  Industry
                </label>
                <select
                  id="industry"
                  className="w-full p-2 rounded-md border border-input bg-background"
                  required
                >
                  <option value="" disabled selected>Select industry</option>
                  <option value="engineering">Engineering</option>
                  <option value="insurance">Insurance</option>
                  <option value="construction">Construction</option>
                  <option value="appraisals">Appraisals</option>
                  <option value="small-business">Small Business</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="template" className="text-sm font-medium">
                  Report Template
                </label>
                <select
                  id="template"
                  className="w-full p-2 rounded-md border border-input bg-background"
                  required
                >
                  <option value="" disabled selected>Select template</option>
                  <option value="site-inspection">Site Inspection</option>
                  <option value="damage-assessment">Damage Assessment</option>
                  <option value="progress-report">Progress Report</option>
                  <option value="property-appraisal">Property Appraisal</option>
                </select>
              </div>
              
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateProject(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setShowCreateProject(false)}
                >
                  Create Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
