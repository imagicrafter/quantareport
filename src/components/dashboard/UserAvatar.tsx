
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User } from 'lucide-react';
import { toast } from 'sonner';

interface UserAvatarProps {
  showName?: boolean;
}

const UserAvatar = ({ showName = false }: UserAvatarProps) => {
  const [userDetails, setUserDetails] = useState<{
    avatar_url?: string | null;
    email?: string | null;
    full_name?: string | null;
  }>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('UserAvatar: Session found, user is authenticated');
          // Get user metadata which might include avatar_url and full_name
          const { avatar_url, full_name, email } = session.user.user_metadata || {};
          setUserDetails({
            avatar_url,
            full_name,
            email: email || session.user.email
          });
        } else {
          console.log('UserAvatar: No session found');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('UserAvatar: Auth state changed:', event);
      
      if (session) {
        const { avatar_url, full_name, email } = session.user.user_metadata || {};
        setUserDetails({
          avatar_url,
          full_name,
          email: email || session.user.email
        });
      } else {
        setUserDetails({});
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Successfully signed out');
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    if (userDetails.full_name) {
      return userDetails.full_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    if (userDetails.email) {
      return userDetails.email.substring(0, 2).toUpperCase();
    }
    
    return 'U';
  };

  const diceBearUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${userDetails.full_name || userDetails.email}`;

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-8 w-8 rounded-full"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={userDetails.avatar_url || diceBearUrl} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Display name if showName is true */}
      {showName && userDetails.full_name && (
        <span className="ml-2 text-sm font-medium text-gray-700 truncate">
          {userDetails.full_name}
        </span>
      )}
    </div>
  );
};

export default UserAvatar;
