
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getSignupCodes, generateSignupCode, SignupCode } from '@/services/signupCodeService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clipboard, Check } from 'lucide-react';

const SignupCodeManager = () => {
  const [codes, setCodes] = useState<SignupCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    setLoading(true);
    const allCodes = await getSignupCodes();
    setCodes(allCodes);
    setLoading(false);
  };

  const handleGenerateCode = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    const userSession = await supabase.auth.getSession();
    
    if (!userSession.data.session) {
      toast.error('You must be logged in to generate codes');
      setLoading(false);
      return;
    }
    
    const adminEmail = userSession.data.session.user.email;
    const result = await generateSignupCode(email, adminEmail || '');
    
    if (result) {
      toast.success(`Code generated for ${email}`);
      setEmail('');
      await loadCodes();
    } else {
      toast.error('Failed to generate code');
    }
    
    setLoading(false);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copied to clipboard');
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string, used: boolean) => {
    if (status === 'active' || used) {
      return <Badge variant="secondary">Active</Badge>;
    } else if (status === 'pending') {
      return <Badge variant="default">Pending</Badge>;
    } else {
      return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Generate New Signup Code</h2>
        <div className="flex gap-3">
          <Input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="max-w-md"
          />
          <Button 
            onClick={handleGenerateCode} 
            disabled={loading || !email}
          >
            Generate Code
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Existing Signup Codes</h2>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Used At</TableHead>
                <TableHead className="w-[80px]">Copy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : codes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                    No signup codes generated yet
                  </TableCell>
                </TableRow>
              ) : (
                codes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono font-medium">
                      {code.code}
                    </TableCell>
                    <TableCell>{code.email}</TableCell>
                    <TableCell>{formatDate(code.created_at)}</TableCell>
                    <TableCell>{code.created_by}</TableCell>
                    <TableCell>
                      {getStatusBadge(code.status, code.used)}
                    </TableCell>
                    <TableCell>
                      {code.used_at ? formatDate(code.used_at) : '—'}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => copyToClipboard(code.code)}
                        disabled={code.used}
                      >
                        {copiedCode === code.code ? 
                          <Check className="h-4 w-4" /> : 
                          <Clipboard className="h-4 w-4" />
                        }
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default SignupCodeManager;
