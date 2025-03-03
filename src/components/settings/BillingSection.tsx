
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

interface BillingSectionProps {
  profile: ProfileData;
}

const BillingSection = ({ profile }: BillingSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription & Billing</CardTitle>
        <CardDescription>Manage your subscription and payment methods</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Current Plan</h3>
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-lg">{profile?.plan || 'Free'} Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.plan === 'free' 
                      ? 'Basic features with limited usage' 
                      : 'Full access to all QuantaReport features'}
                  </p>
                </div>
                <Badge variant={profile?.plan === 'free' ? 'outline' : 'default'}>
                  {profile?.plan === 'free' ? 'Free' : 'Active'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Payment Methods</h3>
            <p className="text-muted-foreground mb-4">No payment methods configured</p>
            <Button variant="outline">
              Add Payment Method
            </Button>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Billing History</h3>
            <p className="text-muted-foreground">No billing history available</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillingSection;
