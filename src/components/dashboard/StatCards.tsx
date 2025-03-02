
import { useState, useEffect } from 'react';
import { FolderPlus, Image, FileArchive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Project {
  id: string;
  name: string;
  created_at: string;
  status: string;
}

interface StatCardsProps {
  projects: Project[];
}

const StatCards = ({ projects }: StatCardsProps) => {
  const [imageCount, setImageCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        
        if (!session.session) return;

        // Get total image count
        const { count: imgCount, error: imgError } = await supabase
          .from('files')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', session.session.user.id)
          .eq('type', 'image');

        if (!imgError) setImageCount(imgCount || 0);

        // Get total report count
        const { count: rpCount, error: rpError } = await supabase
          .from('reports')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', session.session.user.id);

        if (!rpError) setReportCount(rpCount || 0);
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    fetchCounts();
  }, [projects]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
      <div className="glass-card p-6">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
          <FolderPlus size={24} className="text-primary" />
        </div>
        <h3 className="text-lg font-medium mb-1">Projects</h3>
        <p className="text-2xl font-semibold">{projects.length}</p>
      </div>
      
      <div className="glass-card p-6">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
          <Image size={24} className="text-primary" />
        </div>
        <h3 className="text-lg font-medium mb-1">Images</h3>
        <p className="text-2xl font-semibold">{imageCount}</p>
      </div>
      
      <div className="glass-card p-6">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
          <FileArchive size={24} className="text-primary" />
        </div>
        <h3 className="text-lg font-medium mb-1">Reports</h3>
        <p className="text-2xl font-semibold">{reportCount}</p>
      </div>
    </div>
  );
};

export default StatCards;
