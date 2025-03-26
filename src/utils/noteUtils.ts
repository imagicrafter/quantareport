
import { NoteFileRelationship } from './noteFileRelationshipUtils';

// Get n8n webhook URLs from environment variables with fallbacks
export const NOTE_DEV_WEBHOOK_URL = import.meta.env.VITE_N8N_NOTE_DEV_WEBHOOK || 'https://n8n-01.imagicrafterai.com/webhook-test/62d6d438-48ae-47db-850e-5fc52f54e843';
export const NOTE_PROD_WEBHOOK_URL = import.meta.env.VITE_N8N_NOTE_PROD_WEBHOOK || 'https://n8n-01.imagicrafterai.com/webhook/62d6d438-48ae-47db-850e-5fc52f54e843';

export interface NoteFileRelationshipWithType extends NoteFileRelationship {
  file_type: string;
  file_path: string;
}
