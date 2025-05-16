
import { addFile } from './AddFileService';
import { FileFormValues } from '../types/FileTypes';
import { FileType } from '../FileItem';

export const bulkUploadFiles = async (files: File[], projectId: string): Promise<number> => {
  let successCount = 0;
  
  for (const file of files) {
    try {
      // Determine file type based on extension
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      let fileType: FileType = 'other';
      
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
        fileType = 'image';
      } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) {
        fileType = 'audio';
      } else if (['txt', 'md', 'doc', 'docx'].includes(extension)) {
        fileType = 'text';
      }
      
      // Create file values
      const fileValues: FileFormValues = {
        name: file.name,
        description: `Uploaded on ${new Date().toLocaleDateString()}`,
        file: file,
        type: fileType
      };
      
      // Add file
      await addFile(fileValues, projectId);
      successCount++;
    } catch (error) {
      console.error(`Error uploading file ${file.name}:`, error);
      // Continue with next file
    }
  }
  
  return successCount;
};

export const loadFilesFromDriveLink = async (link: string, projectId: string): Promise<number> => {
  // This is a placeholder for the Google Drive integration
  // In a real implementation, this would connect to Google Drive API
  // and download files from the provided link
  
  console.log('Google Drive link integration:', link);
  
  // Return 0 to indicate no files were processed
  // This will trigger the toast notification about backend integration
  return 0;
};
