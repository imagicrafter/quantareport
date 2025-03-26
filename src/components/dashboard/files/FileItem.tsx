
// Add the index prop to FileItemProps
export interface FileItemProps {
  file: ProjectFile;
  onEdit: (file: ProjectFile) => void;
  onDelete: (file: ProjectFile) => void;
  dragHandleProps?: any;
  index: number; // Add this prop
}
