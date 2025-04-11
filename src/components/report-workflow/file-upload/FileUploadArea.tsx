import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { ProjectFile, FileType } from '@/components/dashboard/files/FileItem';

interface FileUploadAreaProps {
  onFilesSelected: (files: ProjectFile[]) => void;
  acceptedFileTypes?: string;
  maxFileSizeMB?: number;
  className?: string;
  files?: File[];
}

const FileUploadArea = ({
  onFilesSelected,
  acceptedFileTypes = '.jpg,.jpeg,.png,.pdf,.doc,.docx,.txt',
  maxFileSizeMB = 10,
  className,
  files = []
}: FileUploadAreaProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const maxFileSize = maxFileSizeMB * 1024 * 1024; // Convert MB to bytes
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };
  
  const handleFiles = async (fileList: File[]) => {
    const validFiles = fileList.filter(file => {
      // Check file size
      if (file.size > maxFileSize) {
        console.warn(`File ${file.name} exceeds the maximum size limit of ${maxFileSizeMB}MB.`);
        return false;
      }
      
      // Check file type if acceptedFileTypes is specified
      if (acceptedFileTypes) {
        const fileType = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
        const accepted = acceptedFileTypes.split(',').some(type => {
          return type.trim() === fileType || type.trim() === file.type;
        });
        
        if (!accepted) {
          console.warn(`File ${file.name} type is not accepted.`);
          return false;
        }
      }
      
      return true;
    });
    
    if (validFiles.length > 0) {
      setUploading(true);
      
      try {
        // Get current user
        const { data: userData } = await supabase.auth.getUser();
        
        if (!userData.user) {
          console.error('User not authenticated');
          return;
        }
        
        // Upload each file to storage and record in database
        const uploadedFiles: ProjectFile[] = [];
        
        for (const file of validFiles) {
          // Determine file type category
          let fileType: FileType = 'other';
          if (file.type.startsWith('image/')) {
            fileType = 'image';
          } else if (file.type.startsWith('audio/')) {
            fileType = 'audio';
          } else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
            fileType = 'text';
          }
          
          // Upload file to Supabase Storage
          const fileName = `${Date.now()}-${file.name}`;
          const filePath = `${userData.user.id}/${fileName}`;
          const bucketName = fileType === 'image' ? 'pub_images' : 
                            fileType === 'audio' ? 'pub_audio' : 'pub_documents';
          
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file);
            
          if (error) {
            console.error('Error uploading file:', error);
            continue;
          }
          
          // Record file in database
          const { data: fileData, error: fileError } = await supabase
            .from('files')
            .insert({
              name: file.name,
              type: fileType,
              size: file.size,
              file_path: filePath,
              user_id: userData.user.id,
              project_id: '', // This will be set by the parent component
            })
            .select()
            .single();
            
          if (fileError) {
            console.error('Error recording file in database:', fileError);
            continue;
          }
          
          // Make sure the fileData is properly typed as a ProjectFile
          const typedFileData: ProjectFile = {
            id: fileData.id,
            name: fileData.name,
            title: fileData.title,
            description: fileData.description,
            file_path: fileData.file_path,
            type: fileData.type as FileType,
            size: fileData.size,
            created_at: fileData.created_at,
            project_id: fileData.project_id,
            user_id: fileData.user_id,
            position: fileData.position,
            metadata: fileData.metadata
          };
          
          uploadedFiles.push(typedFileData);
        }
        
        // Notify parent component of uploaded files
        if (uploadedFiles.length > 0) {
          onFilesSelected(uploadedFiles);
        }
      } catch (error) {
        console.error('Error in file upload process:', error);
      } finally {
        setUploading(false);
      }
    }
  };
  
  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
          "cursor-pointer"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <Upload className={cn(
          "h-12 w-12 mb-4 transition-colors",
          isDragging ? "text-primary" : "text-muted-foreground"
        )} />
        
        <h3 className="text-lg font-medium mb-2">
          {isDragging ? "Drop files here" : "Drag & Drop Files"}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
          Upload images, documents, or any other files that will be used in your report.
          <br />
          Supported formats: JPG, PNG, PDF, DOC, DOCX, TXT
        </p>
        
        <div className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
          Browse Files
        </div>
        
        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={acceptedFileTypes}
        />
      </div>
      
      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Selected Files ({files.length})</h4>
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center bg-muted p-2 rounded">
                <span className="text-sm truncate max-w-[180px]">{file.name}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {uploading && (
        <div className="mt-4">
          <div className="flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
          </div>
          <p className="text-center mt-2 text-sm text-muted-foreground">Uploading files...</p>
        </div>
      )}
    </div>
  );
};

export default FileUploadArea;
