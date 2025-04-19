
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import FileUploadArea from '../FileUploadArea';
import { ProjectFile } from '@/components/dashboard/files/FileItem';
import { useState } from 'react';

interface FileUploadTabsProps {
  projectId: string;
  onTextSave: (text: string) => Promise<void>;
  onFilesUploaded: (files: ProjectFile[]) => void;
}

const FileUploadTabs = ({ projectId, onTextSave, onFilesUploaded }: FileUploadTabsProps) => {
  const [pastedText, setPastedText] = useState('');

  return (
    <Tabs defaultValue="upload" className="w-full">
      <TabsList className="grid w-[400px] grid-cols-2">
        <TabsTrigger value="upload">Upload Files</TabsTrigger>
        <TabsTrigger value="text">Paste Text</TabsTrigger>
      </TabsList>

      <TabsContent value="upload">
        <FileUploadArea 
          onFilesSelected={onFilesUploaded} 
          acceptedFileTypes=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
          files={[]}
          projectId={projectId}
        />
      </TabsContent>

      <TabsContent value="text">
        <div className="space-y-4">
          <Textarea
            placeholder="Paste your text here..."
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            className="min-h-[200px] w-full p-4"
          />
          <Button
            onClick={() => onTextSave(pastedText)}
            disabled={!pastedText.trim()}
            className="w-full"
          >
            Save Text as File
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default FileUploadTabs;
