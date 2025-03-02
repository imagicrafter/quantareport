
import { FolderPlus, Image, FileArchive } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  date: string;
  imageCount: number;
  reportStatus: string;
}

interface StatCardsProps {
  projects: Project[];
}

const StatCards = ({ projects }: StatCardsProps) => {
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
        <p className="text-2xl font-semibold">44</p>
      </div>
      
      <div className="glass-card p-6">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
          <FileArchive size={24} className="text-primary" />
        </div>
        <h3 className="text-lg font-medium mb-1">Reports</h3>
        <p className="text-2xl font-semibold">3</p>
      </div>
    </div>
  );
};

export default StatCards;
