
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
    <Select onValueChange={onSelect} value={selectedId}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select an existing project" />
      </SelectTrigger>
      <SelectContent>
        {projects.map(project => (
          <SelectItem key={project.id} value={project.id}>
            {project.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ProjectSelector;
