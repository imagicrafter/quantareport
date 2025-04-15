
import { useState } from 'react';
import { NoteFileRelationshipWithType } from '@/utils/noteUtils';
import { fetchRelatedFiles } from '@/utils/noteFileRelationshipUtils';

export const useNoteRelationships = () => {
  const [relatedFiles, setRelatedFiles] = useState<NoteFileRelationshipWithType[]>([]);
  const [addNoteRelatedFiles, setAddNoteRelatedFiles] = useState<NoteFileRelationshipWithType[]>([]);

  const fetchFileRelationships = async (noteId: string): Promise<NoteFileRelationshipWithType[]> => {
    try {
      const filesWithTypes = await fetchRelatedFiles(noteId);
      return filesWithTypes;
    } catch (error) {
      console.error('Error fetching related files:', error);
      return [];
    }
  };

  return {
    relatedFiles,
    addNoteRelatedFiles,
    setRelatedFiles,
    setAddNoteRelatedFiles,
    fetchFileRelationships,
  };
};
