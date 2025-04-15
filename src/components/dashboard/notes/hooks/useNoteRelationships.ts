
import { useState } from 'react';
import { NoteFileRelationshipWithType } from '@/utils/noteUtils';
import { fetchRelatedFiles } from '@/utils/noteFileRelationshipUtils';

export const useNoteRelationships = () => {
  const [relatedFiles, setRelatedFiles] = useState<NoteFileRelationshipWithType[]>([]);
  const [addNoteRelatedFiles, setAddNoteRelatedFiles] = useState<NoteFileRelationshipWithType[]>([]);

  const fetchFileRelationships = async (noteId: string) => {
    try {
      const filesWithTypes = await fetchRelatedFiles(noteId);
      setRelatedFiles(filesWithTypes);
    } catch (error) {
      console.error('Error fetching related files:', error);
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

