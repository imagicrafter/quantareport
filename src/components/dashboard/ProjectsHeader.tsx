
import { Plus, Upload } from 'lucide-react';
import Button from '../ui-elements/Button';

interface ProjectsHeaderProps {
  setShowCreateProject: (show: boolean) => void;
}

const ProjectsHeader = ({ setShowCreateProject }: ProjectsHeaderProps) => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <h2 className="text-xl font-semibold">Recent Projects</h2>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          icon={<Upload size={16} />}
        >
          Import
        </Button>
        <Button 
          variant="primary" 
          size="sm"
          icon={<Plus size={16} />}
          onClick={() => setShowCreateProject(true)}
        >
          New Project
        </Button>
      </div>
    </div>
  );
};

export default ProjectsHeader;
