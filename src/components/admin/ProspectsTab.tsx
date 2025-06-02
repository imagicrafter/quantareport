
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Edit, Trash2, Eye, RefreshCw } from 'lucide-react';
import { getProspects, updateProspect, deleteProspect, type Prospect } from '@/services/prospectService';
import { toast } from 'sonner';

const statusOptions = ['new', 'contacted', 'interested', 'demo_scheduled', 'converted', 'not_interested'];

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  interested: 'bg-green-100 text-green-800',
  demo_scheduled: 'bg-purple-100 text-purple-800',
  converted: 'bg-emerald-100 text-emerald-800',
  not_interested: 'bg-gray-100 text-gray-800'
};

const ProspectsTab = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Prospect>>({});

  const loadProspects = async () => {
    setLoading(true);
    const data = await getProspects();
    setProspects(data);
    setLoading(false);
  };

  useEffect(() => {
    loadProspects();
  }, []);

  const handleEdit = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setEditFormData({
      status: prospect.status,
      notes: prospect.notes || '',
      followed_up_at: prospect.followed_up_at
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedProspect) return;

    const success = await updateProspect(selectedProspect.id, editFormData);
    if (success) {
      setIsEditing(false);
      setSelectedProspect(null);
      loadProspects();
    }
  };

  const handleDelete = async (prospect: Prospect) => {
    if (window.confirm(`Are you sure you want to delete ${prospect.email}?`)) {
      const success = await deleteProspect(prospect.id);
      if (success) {
        loadProspects();
      }
    }
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

  const getProspectStats = () => {
    const total = prospects.length;
    const byStatus = prospects.reduce((acc, prospect) => {
      acc[prospect.status] = (acc[prospect.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, byStatus };
  };

  const stats = getProspectStats();

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
          <h2 className="text-2xl font-bold">Prospects Management</h2>
          <p className="text-muted-foreground">
            Manage and track potential customers who have shown interest in QuantaReport
          </p>
        </div>
        <Button onClick={loadProspects} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Prospects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">New</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.byStatus.new || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Interested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.byStatus.interested || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Converted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{stats.byStatus.converted || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Prospects Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Prospects</CardTitle>
          <CardDescription>
            View and manage all prospects who have expressed interest
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prospects.map((prospect) => (
                  <TableRow key={prospect.id}>
                    <TableCell className="font-medium">{prospect.email}</TableCell>
                    <TableCell>{prospect.name || '-'}</TableCell>
                    <TableCell>{prospect.company || '-'}</TableCell>
                    <TableCell>{prospect.interest_area || '-'}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[prospect.status as keyof typeof statusColors]}>
                        {prospect.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{prospect.source}</TableCell>
                    <TableCell>{formatDate(prospect.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Prospect Details</DialogTitle>
                              <DialogDescription>
                                Detailed information for {prospect.email}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div><strong>Email:</strong> {prospect.email}</div>
                              <div><strong>Name:</strong> {prospect.name || 'Not provided'}</div>
                              <div><strong>Company:</strong> {prospect.company || 'Not provided'}</div>
                              <div><strong>Interest Area:</strong> {prospect.interest_area || 'Not specified'}</div>
                              <div><strong>Source:</strong> {prospect.source}</div>
                              <div><strong>Status:</strong> {prospect.status}</div>
                              <div><strong>Created:</strong> {formatDate(prospect.created_at)}</div>
                              <div><strong>Last Updated:</strong> {formatDate(prospect.updated_at)}</div>
                              {prospect.followed_up_at && (
                                <div><strong>Followed Up:</strong> {formatDate(prospect.followed_up_at)}</div>
                              )}
                              {prospect.notes && (
                                <div>
                                  <strong>Notes:</strong>
                                  <p className="mt-1 p-2 bg-gray-50 rounded">{prospect.notes}</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(prospect)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(prospect)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Prospect</DialogTitle>
            <DialogDescription>
              Update status and add notes for {selectedProspect?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select 
                value={editFormData.status} 
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                placeholder="Add notes about this prospect..."
                value={editFormData.notes || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProspectsTab;
