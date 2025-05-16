
import { ProjectFile, FileType } from './FileItem';
import { FileFormValues } from './types/FileTypes';
import { 
  fetchFiles, 
  addFile, 
  updateFile, 
  deleteFile, 
  bulkUploadFiles, 
  loadFilesFromDriveLink 
} from './services';

// Re-export everything for backward compatibility
export type { FileFormValues };
export { 
  fetchFiles, 
  addFile, 
  updateFile, 
  deleteFile, 
  bulkUploadFiles,
  loadFilesFromDriveLink
};
