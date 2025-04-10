
import { useState, useEffect } from 'react';
import { LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
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

  const handleSignOut = async () => {
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

  return (
    <div className="flex items-center">
      <HoverCard>
        <HoverCardTrigger asChild>
          <button className="p-1 rounded-full hover:bg-secondary transition-colors">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={userDetails.avatar_url || undefined} 
                alt={userDetails.full_name || 'User'} 
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </button>
        </HoverCardTrigger>
        <HoverCardContent className="w-56 p-0">
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={userDetails.avatar_url || undefined} alt="Avatar" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{userDetails.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{userDetails.email}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-border">
            <div className="p-2">
              <button 
                onClick={() => navigate('/dashboard/settings')}
                className="w-full flex items-center gap-2 text-sm px-3 py-2 hover:bg-secondary rounded-md"
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 text-sm px-3 py-2 hover:bg-secondary rounded-md text-red-500 hover:text-red-600"
              >
                <LogOut size={16} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
      
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
