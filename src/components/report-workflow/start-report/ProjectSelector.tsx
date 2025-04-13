
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Project {
  id: string;
  name: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  selectedId: string;
  onSelect: (projectId: string) => void;
}

const ProjectSelector = ({ projects, selectedId, onSelect }: ProjectSelectorProps) => {
  return (
    <div>
      <label className="block mb-2 text-sm font-medium">Select Existing Project</label>
      <Select onValueChange={onSelect} value={selectedId || undefined}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an existing project" />
        </SelectTrigger>
        <SelectContent>
          {projects.length > 0 ? (
            projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="no-projects" disabled>
              No projects available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProjectSelector;
