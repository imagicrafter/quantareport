import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { UploadCloud, FileQuestion, Link } from 'lucide-react';
import CustomButton from '../../ui-elements/Button';

export interface BulkUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFiles: (files: File[]) => Promise<void>;
  onUploadFromLink: (link: string) => Promise<void>;
  uploading: boolean;
  projectId: string;
}

const BulkUploadDialog = ({
  isOpen,
  onClose,
  onUploadFiles,
  onUploadFromLink,
  uploading,
  projectId
}: BulkUploadDialogProps) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  // NOTE: Temporarily commented out Google Drive functionality - keep for future re-enabling
  const [driveLink, setDriveLink] = useState('');
  const [activeTab, setActiveTab] = useState('upload');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (activeTab === 'upload') {
      if (files.length === 0) {
        toast({
          title: 'No files selected',
          description: 'Please select files to upload.',
          variant: 'destructive',
        });
        return;
      }
      
      await onUploadFiles(files);
      setFiles([]);
    } 
    // NOTE: Google Drive upload functionality temporarily disabled - uncomment below to re-enable
    /* else {
      if (!driveLink.trim()) {
        toast({
          title: 'No link provided',
          description: 'Please enter a Google Drive link.',
          variant: 'destructive',
        });
        return;
      }
      
      await onUploadFromLink(driveLink);
      setDriveLink('');
    } */
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
      setActiveTab('upload');
    }
  };

  const getFileTypeInfo = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return { type: 'image', color: 'blue' };
    } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) {
      return { type: 'audio', color: 'purple' };
    } else if (['txt', 'md', 'doc', 'docx'].includes(extension)) {
      return { type: 'document', color: 'green' };
    } else {
      return { type: 'other', color: 'gray' };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" onDragOver={handleDragOver} onDrop={handleDrop}>
        <DialogHeader>
          <DialogTitle>Bulk Upload Files</DialogTitle>
          <DialogDescription>
            Upload multiple files at once to your project.
          </DialogDescription>
        </DialogHeader>
        
        {/* NOTE: Temporarily showing only Upload Files tab - Google Drive tab commented out for future re-enabling */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="upload">Upload Files</TabsTrigger>
            {/* NOTE: Google Drive tab temporarily disabled - uncomment to re-enable
            <TabsTrigger value="drive">Google Drive</TabsTrigger>
            */}
          </TabsList>
          
          <TabsContent value="upload" className="py-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-secondary/30 transition-colors">
              <Label htmlFor="multiple-files" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <UploadCloud className="h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">Click or drag and drop to upload</p>
                  <p className="text-sm text-muted-foreground">
                    Supports images, audio files, and text documents
                  </p>
                </div>
                <Input
                  id="multiple-files"
                  type="file"
                  multiple
                  accept="image/*,audio/*,.txt,.md,.doc,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </Label>
            </div>
            
            {files.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Selected Files</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {files.map((file, index) => {
                    const { type, color } = getFileTypeInfo(file);
                    return (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-2 bg-secondary rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`text-${color}-500`}>
                            <FileQuestion size={16} />
                          </div>
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 text-right">
                  <Button variant="ghost" onClick={() => setFiles([])}>Clear All</Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* NOTE: Google Drive tab content temporarily disabled - uncomment entire section below to re-enable
          <TabsContent value="drive" className="py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="drive-link">Google Drive Link</Label>
                <div className="flex items-center mt-2">
                  <div className="p-2 bg-secondary rounded-l-md border-y border-l">
                    <Link size={18} className="text-muted-foreground" />
                  </div>
                  <Input
                    id="drive-link"
                    placeholder="https://drive.google.com/folder/..."
                    className="rounded-l-none"
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Enter the link to a shared Google Drive folder.
                </p>
              </div>
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">
                <p>This feature requires:</p>
                <ul className="list-disc list-inside ml-2 mt-1">
                  <li>A shared Google Drive folder with public access</li>
                  <li>Only images, audio files, and text documents will be imported</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          */}
        </Tabs>
        
        <DialogFooter className="mt-4">
          <CustomButton 
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </CustomButton>
          <CustomButton 
            type="button"
            onClick={handleUpload}
            isLoading={uploading}
          >
            {/* NOTE: Button text simplified since Google Drive option is temporarily disabled */}
            Upload Files
            {/* NOTE: Original dynamic text commented out - uncomment to restore:
            {activeTab === 'upload' ? 'Upload Files' : 'Import from Drive'}
            */}
          </CustomButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadDialog;
