
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getUserSubscription, UserSubscriptionDetails } from '@/services/subscriptionService';
import { Skeleton } from '@/components/ui/skeleton';

// This interface is updated to remove fields that no longer exist on the profiles table
// after the migration.
interface ProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  phone: string | null;
  domain_id?: string | null;
  role?: string;
  updated_at?: string;
}

interface BillingSectionProps {
  profile: ProfileData;
}

const BillingSection = ({ profile }: BillingSectionProps) => {
  const [subscription, setSubscription] = useState<UserSubscriptionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      setIsLoading(true);
      getUserSubscription(profile.id)
        .then(data => {
          setSubscription(data);
        })
        .catch(err => {
          console.error('Failed to get user subscription', err);
          setSubscription(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
        setIsLoading(false);
    }
  }, [profile]);

  const renderCurrentPlan = () => {
    if (isLoading) {
      return (
        <div className="space-y-2 bg-muted p-4 rounded-lg">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
        </div>
      );
    }

    if (!subscription) {
      return <p className="text-muted-foreground">No active subscription found.</p>;
    }

    return (
      <div className="bg-muted p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold text-lg capitalize">{subscription.planName} Plan</p>
            <p className="text-sm text-muted-foreground">
              {subscription.description || (subscription.planName.toLowerCase() === 'free'
                ? 'Basic features with limited usage' 
                : 'Full access to all QuantaReport features')}
            </p>
          </div>
          <Badge variant={subscription.planName.toLowerCase() === 'free' ? 'outline' : 'default'} className="capitalize">
            {subscription.status}
          </Badge>
        </div>
      </div>
    );
  };
  
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
            {renderCurrentPlan()}
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
