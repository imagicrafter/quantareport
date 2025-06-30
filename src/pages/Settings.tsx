import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import ProfileSection from '@/components/settings/ProfileSection';
import SecuritySection from '@/components/settings/SecuritySection';
import NotificationsSection from '@/components/settings/NotificationsSection';
import BillingSection from '@/components/settings/BillingSection';
import { getUserSubscription, UserSubscriptionDetails } from '@/services/subscriptionService';

interface ProfileData {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  phone: string | null;
  domain: string | null;
  domain_id?: string | null;
  role?: string;
  updated_at?: string;
}

interface DomainData {
  id: string;
  name: string;
  description: string | null;
}

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [subscription, setSubscription] = useState<UserSubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [domains, setDomains] = useState<DomainData[]>([]);
  
  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        if (!user) {
          navigate('/signin');
          return;
        }
        
        setUser(user);
        
        // Fetch profile data from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }
        
        // Fetch subscription data
        const subscriptionData = await getUserSubscription(user.id);
        setSubscription(subscriptionData);

        // Fetch domains for dropdown
        const { data: domainsData, error: domainsError } = await supabase
          .from('domains')
          .select('id, name, description')
          .neq('name', 'all');
          
        if (domainsError) {
          throw domainsError;
        }
        
        setDomains(domainsData || []);
        
        if (profileData) {
          // Map the profile data to match our ProfileData interface
          const mappedProfile: ProfileData = {
            id: profileData.id,
            full_name: profileData.full_name || '',
            avatar_url: profileData.avatar_url,
            email: profileData.email || '',
            phone: profileData.phone || '',
            domain: null, // We'll set this after fetching domain info
            domain_id: profileData.domain_id,
            role: profileData.role,
            updated_at: profileData.updated_at
          };
          
          setProfile(mappedProfile);
          
          // If there's a domain_id, get the domain name
          if (profileData.domain_id && domainsData) {
            const userDomain = domainsData.find(d => d.id === profileData.domain_id);
            if (userDomain) {
              mappedProfile.domain = userDomain.name;
            }
          }
        }
        
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
    
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/signin');
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);
  
  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-pulse text-center">
            <div className="h-12 w-48 bg-muted rounded-md mx-auto mb-4"></div>
            <div className="h-4 w-64 bg-muted rounded-md mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>
      
      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        
        {profile && (
          <>
            <TabsContent value="profile">
              <ProfileSection 
                profile={profile} 
                subscription={subscription}
                domains={domains} 
                setProfile={setProfile} 
              />
            </TabsContent>
            
            <TabsContent value="security">
              <SecuritySection user={user} />
            </TabsContent>
            
            <TabsContent value="notifications">
              <NotificationsSection />
            </TabsContent>
            
            <TabsContent value="billing">
              <BillingSection profile={profile} subscription={subscription} isLoading={loading} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;
