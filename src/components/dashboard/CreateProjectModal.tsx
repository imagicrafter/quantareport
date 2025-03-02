
import { X } from 'lucide-react';
import Button from '../ui-elements/Button';

interface CreateProjectModalProps {
  showCreateProject: boolean;
  setShowCreateProject: (show: boolean) => void;
}

const CreateProjectModal = ({ showCreateProject, setShowCreateProject }: CreateProjectModalProps) => {
  if (!showCreateProject) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Create New Project</h2>
          <button 
            onClick={() => setShowCreateProject(false)}
            className="p-1 rounded-full hover:bg-secondary/70"
          >
            <X size={20} />
          </button>
        </div>
        
        <form className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="projectName" className="text-sm font-medium">
              Project Name
            </label>
            <input
              id="projectName"
              type="text"
              className="w-full p-2 rounded-md border border-input bg-background"
              placeholder="Enter project name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="industry" className="text-sm font-medium">
              Industry
            </label>
            <select
              id="industry"
              className="w-full p-2 rounded-md border border-input bg-background"
              required
            >
              <option value="" disabled selected>Select industry</option>
              <option value="engineering">Engineering</option>
              <option value="insurance">Insurance</option>
              <option value="construction">Construction</option>
              <option value="appraisals">Appraisals</option>
              <option value="small-business">Small Business</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="template" className="text-sm font-medium">
              Report Template
            </label>
            <select
              id="template"
              className="w-full p-2 rounded-md border border-input bg-background"
              required
            >
              <option value="" disabled selected>Select template</option>
              <option value="site-inspection">Site Inspection</option>
              <option value="damage-assessment">Damage Assessment</option>
              <option value="progress-report">Progress Report</option>
              <option value="property-appraisal">Property Appraisal</option>
            </select>
          </div>
          
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCreateProject(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowCreateProject(false)}
            >
              Create Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
