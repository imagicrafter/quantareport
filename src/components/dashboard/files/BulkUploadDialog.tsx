
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, Link as LinkIcon, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Button from '../../ui-elements/Button';
import { FileFormValues } from './FileService';

interface BulkUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFiles: (files: File[]) => Promise<void>;
  onUploadFromLink: (link: string) => Promise<void>;
  uploading: boolean;
}

const driveLinkSchema = z.object({
  link: z.string()
    .url('Please enter a valid URL')
    .refine(url => url.includes('drive.google.com'), {
      message: 'Please enter a valid Google Drive link',
    }),
});

const BulkUploadDialog = ({ 
  isOpen, 
  onClose, 
  onUploadFiles,
  onUploadFromLink,
  uploading 
}: BulkUploadDialogProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  
  const linkForm = useForm<z.infer<typeof driveLinkSchema>>({
    resolver: zodResolver(driveLinkSchema),
    defaultValues: {
      link: '',
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async () => {
    if (files.length === 0) return;
    
    await onUploadFiles(files);
    setFiles([]);
  };

  const handleUploadFromLink = async (values: z.infer<typeof driveLinkSchema>) => {
    await onUploadFromLink(values.link);
    linkForm.reset();
  };

  const handleDialogClose = () => {
    setFiles([]);
    linkForm.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Bulk Upload Files</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="files" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="files">Upload Files</TabsTrigger>
            <TabsTrigger value="drive">Google Drive Link</TabsTrigger>
          </TabsList>
          
          <TabsContent value="files" className="mt-4">
            <div
              className={`border-2 border-dashed rounded-md p-8 text-center transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-border'
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <p className="mb-1 font-medium">Drag and drop files</p>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              
              <Input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                multiple
                className="hidden"
              />
              <Button 
                type="button" 
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Select Files
              </Button>
            </div>
            
            {files.length > 0 && (
              <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                <p className="text-sm font-medium mb-2">Selected Files ({files.length})</p>
                {files.map((file, index) => (
                  <Card key={index} className="p-2 flex justify-between items-center">
                    <div className="text-sm truncate mr-2 max-w-[calc(100%-80px)]">
                      {file.name}
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      className="h-6 px-2"
                    >
                      Remove
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="drive" className="mt-4">
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <p className="text-sm mb-2">To share a Google Drive folder or file:</p>
                <ol className="text-xs list-decimal pl-4 space-y-1">
                  <li>Open the folder or file in Google Drive</li>
                  <li>Click the "Share" button</li>
                  <li>Click "Get link"</li>
                  <li>Change the access to "Anyone with the link"</li>
                  <li>Copy the link and paste it below</li>
                </ol>
              </AlertDescription>
            </Alert>

            <Form {...linkForm}>
              <form onSubmit={linkForm.handleSubmit(handleUploadFromLink)} className="space-y-4">
                <FormField
                  control={linkForm.control}
                  name="link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Drive Link</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <div className="relative flex-grow">
                            <LinkIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="https://drive.google.com/drive/folders/..." 
                              className="pl-8" 
                              {...field} 
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-6">
          <Button 
            type="button"
            variant="ghost"
            onClick={handleDialogClose}
          >
            Cancel
          </Button>
          
          <Tabs.Consumer>
            {(value) => (
              value === "files" ? (
                <Button 
                  type="button"
                  isLoading={uploading}
                  disabled={files.length === 0 || uploading}
                  onClick={handleUploadFiles}
                >
                  Upload {files.length} Files
                </Button>
              ) : (
                <Button 
                  type="button"
                  isLoading={uploading}
                  disabled={!linkForm.formState.isValid || uploading}
                  onClick={linkForm.handleSubmit(handleUploadFromLink)}
                >
                  Load Files
                </Button>
              )
            )}
          </Tabs.Consumer>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadDialog;
