
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Template } from '@/types/template.types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PlusCircle, ShieldAlert, Filter } from 'lucide-react'; 
import TemplateEditForm from '@/components/templates/TemplateEditForm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TemplatesTab = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, string>>({});
  const [domains, setDomains] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Filter states
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [publicFilter, setPublicFilter] = useState<boolean | null>(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    // Check if user is admin before allowing access
    const checkAdminRole = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (session.session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.session.user.id)
          .single();
        
        if (profile && profile.role === 'admin') {
          setIsAdmin(true);
          loadTemplates();
          loadUserProfiles();
          loadDomains();
        } else {
          toast.error("You don't have permission to access this page");
        }
      }
    };
    
    checkAdminRole();
  }, []);

  useEffect(() => {
    // Apply filters whenever filter values or templates change
    applyFilters();
  }, [templates, domainFilter, userFilter, publicFilter, searchText]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
      setFilteredTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email');

      if (error) throw error;
      
      const profileMap: Record<string, string> = {};
      (data || []).forEach(profile => {
        profileMap[profile.id] = profile.email || 'Unknown';
      });
      
      setUserProfiles(profileMap);
    } catch (error) {
      console.error('Error loading user profiles:', error);
    }
  };

  const loadDomains = async () => {
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('id, name');

      if (error) throw error;
      
      const domainMap: Record<string, string> = {};
      (data || []).forEach(domain => {
        domainMap[domain.id] = domain.name || 'Unknown';
      });
      
      setDomains(domainMap);
    } catch (error) {
      console.error('Error loading domains:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...templates];
    
    // Apply domain filter
    if (domainFilter !== 'all') {
      filtered = filtered.filter(template => 
        domainFilter === 'none' 
          ? !template.domain_id 
          : template.domain_id === domainFilter
      );
    }
    
    // Apply user filter
    if (userFilter !== 'all') {
      filtered = filtered.filter(template => 
        userFilter === 'none' 
          ? !template.user_id 
          : template.user_id === userFilter
      );
    }
    
    // Apply public filter
    if (publicFilter !== null) {
      filtered = filtered.filter(template => template.is_public === publicFilter);
    }
    
    // Apply search filter
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(search) || 
        (template.description && template.description.toLowerCase().includes(search))
      );
    }
    
    setFilteredTemplates(filtered);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setIsCreating(false);
  };

  const handleCreateTemplate = () => {
    const newTemplate: Template = {
      id: '',
      name: 'New Template',
      description: '',
      image_module: null,
      report_module: null,
      layout_module: null,
      is_public: false,
      domain_id: null,
      user_id: null,
      parent_template_id: null, // Add the new field
      created_at: null
    };
    setEditingTemplate(newTemplate);
    setIsCreating(true);
  };

  const handleUpdateSuccess = (updatedTemplate: Template) => {
    if (isCreating) {
      setTemplates(prevTemplates => [updatedTemplate, ...prevTemplates]);
    } else {
      setTemplates(prevTemplates => 
        prevTemplates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t)
      );
    }
    setEditingTemplate(null);
    setIsCreating(false);
    toast.success(isCreating ? 'Template created successfully' : 'Template updated successfully');
  };

  const getTemplateType = (template: Template) => {
    const types = [];
    if (template.image_module) types.push("Image");
    if (template.report_module) types.push("Report");
    if (template.layout_module) types.push("Layout");
    return types.length > 0 ? types.join(", ") : "—";
  };

  const getUserOptions = () => {
    const options = Object.entries(userProfiles).map(([id, email]) => ({
      value: id,
      label: email
    }));
    
    return [
      { value: 'all', label: 'All Users' },
      { value: 'none', label: 'No User' },
      ...options
    ];
  };
  
  const getDomainOptions = () => {
    const options = Object.entries(domains).map(([id, name]) => ({
      value: id,
      label: name
    }));
    
    return [
      { value: 'all', label: 'All Domains' },
      { value: 'none', label: 'No Domain' },
      ...options
    ];
  };

  const resetFilters = () => {
    setDomainFilter('all');
    setUserFilter('all');
    setPublicFilter(null);
    setSearchText('');
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
        <p className="text-muted-foreground">You don't have permission to access this section.</p>
      </div>
    );
  }

  if (editingTemplate) {
    return (
      <div>
        <Button 
          variant="outline" 
          onClick={() => {
            setEditingTemplate(null);
            setIsCreating(false);
          }} 
          className="mb-4"
        >
          ← Back to Templates
        </Button>
        <TemplateEditForm 
          currentTemplate={editingTemplate}
          onSuccess={handleUpdateSuccess}
          onCancel={() => {
            setEditingTemplate(null);
            setIsCreating(false);
          }}
          isCreating={isCreating}
          domains={domains}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Admin Template Management</h2>
        <Button onClick={handleCreateTemplate}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Template
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search templates..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full"
          />
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {(domainFilter !== 'all' || userFilter !== 'all' || publicFilter !== null) && (
                <span className="ml-1 rounded-full bg-primary w-2 h-2"></span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain-filter">Domain</Label>
                <Select value={domainFilter} onValueChange={setDomainFilter}>
                  <SelectTrigger id="domain-filter">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {getDomainOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="user-filter">User</Label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger id="user-filter">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {getUserOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="public-filter">Public Status</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="public-yes"
                      checked={publicFilter === true}
                      onCheckedChange={() => setPublicFilter(publicFilter === true ? null : true)}
                    />
                    <label htmlFor="public-yes">Public</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="public-no"
                      checked={publicFilter === false}
                      onCheckedChange={() => setPublicFilter(publicFilter === false ? null : false)}
                    />
                    <label htmlFor="public-no">Private</label>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetFilters} 
                className="w-full mt-2"
              >
                Reset Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Public</TableHead>
              <TableHead className="w-[100px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Loading templates...
                </TableCell>
              </TableRow>
            ) : filteredTemplates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  No templates found
                </TableCell>
              </TableRow>
            ) : (
              filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    {template.name}
                  </TableCell>
                  <TableCell>
                    {template.domain_id ? domains[template.domain_id] || 'Unknown' : '—'}
                  </TableCell>
                  <TableCell>
                    {template.description || '—'}
                  </TableCell>
                  <TableCell>
                    {getTemplateType(template)}
                  </TableCell>
                  <TableCell>
                    {template.user_id ? userProfiles[template.user_id] || 'Unknown' : '—'}
                  </TableCell>
                  <TableCell>
                    {template.is_public ? 'Yes' : 'No'}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditTemplate(template)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TemplatesTab;
