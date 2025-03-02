
import { Link } from 'react-router-dom';
import Button from '../ui-elements/Button';

interface Project {
  id: string;
  name: string;
  date: string;
  imageCount: number;
  reportStatus: string;
}

interface ProjectsTableProps {
  projects: Project[];
}

const ProjectsTable = ({ projects }: ProjectsTableProps) => {
  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Date Created</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Images</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
              <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b border-border hover:bg-secondary/40 transition-colors">
                <td className="p-4 whitespace-nowrap">
                  <div className="font-medium">{project.name}</div>
                </td>
                <td className="p-4 whitespace-nowrap text-muted-foreground">
                  {new Date(project.date).toLocaleDateString()}
                </td>
                <td className="p-4 whitespace-nowrap text-muted-foreground">
                  {project.imageCount}
                </td>
                <td className="p-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    project.reportStatus === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : project.reportStatus === 'processing' 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {project.reportStatus.charAt(0).toUpperCase() + project.reportStatus.slice(1)}
                  </span>
                </td>
                <td className="p-4 whitespace-nowrap text-right">
                  <Link to={`/dashboard/projects/${project.id}`}>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectsTable;
