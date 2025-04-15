
import { fetchRelatedFiles } from '@/utils/noteFileRelationshipUtils';
import { NoteFileRelationshipWithType } from '@/utils/noteUtils';

export const useNoteFileRelationships = () => {
  const fetchFileRelationships = async (noteId: string) => {
    if (noteId) {
      const filesWithTypes = await fetchRelatedFiles(noteId);
      return filesWithTypes;
    }
    return [];
  };

  const handleAddNoteRelationshipChange = (
    addNoteRelatedFiles: NoteFileRelationshipWithType[],
    setAddNoteRelatedFiles: React.Dispatch<React.SetStateAction<NoteFileRelationshipWithType[]>>,
    tempNoteId: string | null,
    fetchFileRelationshipsFn: (noteId: string) => Promise<NoteFileRelationshipWithType[]>
  ) => (newRelationship?: NoteFileRelationshipWithType) => {
    if (newRelationship) {
      setAddNoteRelatedFiles(prev => {
        const exists = prev.some(rel => rel.id === newRelationship.id);
        if (exists) {
          return prev;
        }
        return [...prev, newRelationship];
      });
    } else {
      if (tempNoteId) {
        fetchFileRelationshipsFn(tempNoteId).then(files => {
          setAddNoteRelatedFiles(files);
        });
      }
    }
  };

  const handleRemoveRelationship = (
    setAddNoteRelatedFiles: React.Dispatch<React.SetStateAction<NoteFileRelationshipWithType[]>>
  ) => (relationshipId: string) => {
    setAddNoteRelatedFiles(prev => prev.filter(rel => rel.id !== relationshipId));
  };

  return {
    fetchFileRelationships,
    handleAddNoteRelationshipChange,
    handleRemoveRelationship
  };
};
