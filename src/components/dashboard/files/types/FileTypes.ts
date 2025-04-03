
import { FileType } from '../FileItem';

export interface FileFormValues {
  name: string;
  title?: string;
  description?: string;
  file?: File;
  file_path?: string;
  type: FileType;
}
