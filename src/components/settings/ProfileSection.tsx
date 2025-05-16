
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProfileData {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  phone: string | null;
  domain: string | null;
  plan: string;
  domain_id?: string | null;
  role?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status?: string;
  updated_at?: string;
}

interface DomainData {
  id: string;
  name: string;
  description: string | null;
}

interface ProfileSectionProps {
  profile: ProfileData;
  domains: DomainData[];
  setProfile: (profile: ProfileData) => void;
}

const ProfileSection = ({ profile, domains, setProfile }: ProfileSectionProps) => {
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [email, setEmail] = useState(profile.email || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [selectedDomain, setSelectedDomain] = useState(profile.domain_id || '');
  const [saving, setSaving] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          domain_id: selectedDomain || null
        })
        .eq('id', profile.id);
      
      if (error) throw error;
      
      toast.success('Profile updated successfully');
      
      // Find the selected domain name
      const domainName = selectedDomain 
        ? domains.find(d => d.id === selectedDomain)?.name || null
        : null;
          
      // Update local state
      setProfile({
        ...profile,
        full_name: fullName,
        phone,
        domain_id: selectedDomain,
        domain: domainName
      });
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3 flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={profile.avatar_url || undefined} alt={fullName} />
              <AvatarFallback>{fullName.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">Upload Photo</Button>
            <div className="mt-4 w-full">
              <Badge variant="outline" className="w-full justify-center py-1.5">
                {profile.plan || 'Free'} Plan
              </Badge>
            </div>
          </div>
          
          <div className="md:w-2/3">
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">Your email address is managed through authentication settings</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Your phone number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Fix: Use a non-empty string for value */}
                      <SelectItem value="none">None</SelectItem>
                      {domains.map(domain => (
                        <SelectItem key={domain.id} value={domain.id}>
                          {domain.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select the domain that best describes your field
                  </p>
                </div>
              </div>
              
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSection;
