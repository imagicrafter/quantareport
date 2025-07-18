import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Upload, Edit, Trash2, Copy, RefreshCw, ExternalLink, Clock } from 'lucide-react';
import { 
  getCustomReports, 
  uploadCustomReport, 
  updateCustomReport, 
  deleteCustomReport,
  type CustomReport 
} from '@/services/customReportsService';
import { toast } from 'sonner';

const CustomReportsTab = () => {
  const [reports, setReports] = useState<CustomReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CustomReport | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: ''
  });

  const loadReports = async () => {
    setLoading(true);
    const data = await getCustomReports();
    setReports(data);
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/html' && !file.name.toLowerCase().endsWith('.html')) {
        toast.error('Please select an HTML file');
        return;
      }
      setUploadFile(file);
      setUploadForm({
        title: file.name.replace('.html', ''),
        description: ''
      });
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file');
      return;
    }

    const result = await uploadCustomReport(
      uploadFile,
      uploadForm.title,
      uploadForm.description
    );

    if (result.success) {
      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadForm({ title: '', description: '' });
      loadReports();
    }
  };

  const handleEdit = (report: CustomReport) => {
    setSelectedReport(report);
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedReport) return;

    const success = await updateCustomReport(selectedReport.id, {
      title: selectedReport.title,
      description: selectedReport.description,
      is_active: selectedReport.is_active
    });

    if (success) {
      setEditDialogOpen(false);
      setSelectedReport(null);
      loadReports();
    }
  };

  const handleDelete = async (report: CustomReport) => {
    if (window.confirm(`Are you sure you want to delete "${report.title}"?`)) {
      const success = await deleteCustomReport(report.id, report.file_path);
      if (success) {
        loadReports();
      }
    }
  };

  const copyReportUrl = (token: string) => {
    const url = `${window.location.origin}/report/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Report URL copied to clipboard');
  };

  const openReport = (token: string) => {
    const url = `${window.location.origin}/report/${token}`;
    window.open(url, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUrlExpirationStatus = (expiresAt?: string) => {
    if (!expiresAt) return { status: 'unknown', text: 'Unknown', color: 'gray' };
    
    const expiration = new Date(expiresAt);
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    if (expiration < now) {
      return { status: 'expired', text: 'Expired', color: 'red' };
    } else if (expiration < sevenDaysFromNow) {
      return { status: 'expiring', text: 'Expiring Soon', color: 'yellow' };
    } else {
      return { status: 'valid', text: 'Valid', color: 'green' };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Custom Reports</h2>
          <p className="text-muted-foreground">
            Upload and manage custom HTML reports with secure access URLs and OpenAI integration
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadReports} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Custom HTML Report</DialogTitle>
                <DialogDescription>
                  Upload an HTML file to create a publicly accessible custom report with secure 30-day access URLs and OpenAI API integration
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">HTML File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".html,text/html"
                    onChange={handleFileSelect}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Report title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Report description (optional)"
                    rows={3}
                  />
                </div>

                {/* OpenAI Integration Documentation */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">OpenAI Integration Available</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    Your custom reports can now access OpenAI API through a secure proxy. Use the following in your HTML:
                  </p>
                  <div className="bg-blue-100 p-2 rounded text-xs font-mono text-blue-800">
                    {`// Available globally in your custom reports
// Chat completions
const response = await window.OpenAI.chatCompletions([
  { role: 'user', content: 'Hello!' }
]);

// Generate images
const image = await window.OpenAI.generateImage('A beautiful sunset');

// Get embeddings
const embeddings = await window.OpenAI.getEmbeddings('Text to embed');`}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpload} disabled={!uploadFile}>
                    Upload Report
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Reports Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{reports.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {reports.filter(r => r.is_active).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {reports.reduce((sum, r) => sum + r.access_count, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">URLs Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {reports.filter(r => {
                const status = getUrlExpirationStatus(r.url_expires_at);
                return status.status === 'expiring' || status.status === 'expired';
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Custom Reports</CardTitle>
          <CardDescription>
            Manage your uploaded HTML reports and their secure access URLs (30-day expiration)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>URL Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Accessed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const urlStatus = getUrlExpirationStatus(report.url_expires_at);
                  return (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{report.title}</div>
                          {report.description && (
                            <div className="text-sm text-muted-foreground">
                              {report.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{report.original_filename}</TableCell>
                      <TableCell>
                        <Badge variant={report.is_active ? 'default' : 'secondary'}>
                          {report.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              urlStatus.color === 'green' ? 'default' : 
                              urlStatus.color === 'yellow' ? 'secondary' : 'destructive'
                            }
                          >
                            {urlStatus.text}
                          </Badge>
                          {report.url_expires_at && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expires {formatDate(report.url_expires_at)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{report.access_count}</TableCell>
                      <TableCell>{formatDate(report.created_at)}</TableCell>
                      <TableCell>
                        {report.last_accessed_at ? formatDate(report.last_accessed_at) : 'Never'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openReport(report.token)}
                            title="Open report"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyReportUrl(report.token)}
                            title="Copy URL"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(report)}
                            title="Edit report"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(report)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete report"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Custom Report</DialogTitle>
            <DialogDescription>
              Update the report details and status
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={selectedReport.title || ''}
                  onChange={(e) => setSelectedReport(prev => 
                    prev ? { ...prev, title: e.target.value } : null
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedReport.description || ''}
                  onChange={(e) => setSelectedReport(prev => 
                    prev ? { ...prev, description: e.target.value } : null
                  )}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={selectedReport.is_active ? 'active' : 'inactive'}
                  onValueChange={(value) => setSelectedReport(prev => 
                    prev ? { ...prev, is_active: value === 'active' } : null
                  )}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Public URL</Label>
                <div className="flex space-x-2">
                  <Input
                    value={`${window.location.origin}/report/${selectedReport.token}`}
                    readOnly
                    className="bg-gray-50"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyReportUrl(selectedReport.token)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {selectedReport.url_expires_at && (
                <div className="space-y-2">
                  <Label>URL Expiration</Label>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        getUrlExpirationStatus(selectedReport.url_expires_at).color === 'green' ? 'default' : 
                        getUrlExpirationStatus(selectedReport.url_expires_at).color === 'yellow' ? 'secondary' : 'destructive'
                      }
                    >
                      {getUrlExpirationStatus(selectedReport.url_expires_at).text}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(selectedReport.url_expires_at)}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomReportsTab;
