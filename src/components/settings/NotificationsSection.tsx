
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const NotificationsSection = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [projectUpdates, setProjectUpdates] = useState(true);

  const handleSavePreferences = () => {
    // In a real app, this would save to the backend
    toast.success('Notification preferences saved');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Manage how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Email Notifications</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Marketing emails</p>
                <p className="text-sm text-muted-foreground">Receive emails about new features and improvements</p>
              </div>
              <Switch 
                checked={emailNotifications} 
                onCheckedChange={setEmailNotifications} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Security alerts</p>
                <p className="text-sm text-muted-foreground">Get notified about security events on your account</p>
              </div>
              <Switch checked={true} disabled />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Project updates</p>
                <p className="text-sm text-muted-foreground">Receive notifications when your projects are updated</p>
              </div>
              <Switch 
                checked={projectUpdates} 
                onCheckedChange={setProjectUpdates} 
              />
            </div>
          </div>
          
          <Button onClick={handleSavePreferences}>
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationsSection;
