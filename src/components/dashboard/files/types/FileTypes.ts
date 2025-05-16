
export type FileType = 'image' | 'audio' | 'text' | 'folder' | 'transcription' | 'other';

export interface FileFormValues {
  name: string;
  title?: string;
  description?: string;
  file?: File;
  file_path?: string;
  type: FileType;
}
