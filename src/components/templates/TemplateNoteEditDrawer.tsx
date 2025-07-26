
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Edit, Save, X } from 'lucide-react';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose
} from '@/components/ui/drawer';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { updateTemplateNote } from '@/utils/templateNoteUtils';

interface TemplateNote {
  id: string;
  template_id: string;
  title: string;
  name: string;
  custom_content: string | null;
  position: number | null;
}

interface TemplateNoteEditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  templateNote: TemplateNote | null;
  onUpdate: (updatedNote: TemplateNote) => void;
}

const TemplateNoteEditDrawer = ({ 
  isOpen, 
  onClose, 
  templateNote, 
  onUpdate 
}: TemplateNoteEditDrawerProps) => {
  const [customContent, setCustomContent] = useState(templateNote?.custom_content || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!templateNote) return;

    try {
      setSaving(true);
      await updateTemplateNote(templateNote.id, { 
        custom_content: customContent 
      });
      
      const updatedNote = {
        ...templateNote,
        custom_content: customContent
      };
      
      onUpdate(updatedNote);
      toast.success('Template note updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating template note:', error);
      toast.error('Failed to update template note');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  // Reset content when template note changes
  React.useEffect(() => {
    if (templateNote) {
      setCustomContent(templateNote.custom_content || '');
    }
  }, [templateNote]);

  if (!templateNote) return null;

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-w-2xl mx-auto">
        <DrawerHeader>
          <DrawerTitle>Edit Template Note</DrawerTitle>
          <p className="text-sm text-muted-foreground">{templateNote.title}</p>
        </DrawerHeader>
        
        <div className="px-4 pb-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Custom Content
              </label>
              <Textarea
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                placeholder="Enter custom content for this template note..."
                className="min-h-[200px] resize-none"
              />
            </div>
          </div>
        </div>

        <DrawerFooter>
          <div className="flex gap-2 justify-end">
            <DrawerClose asChild>
              <Button variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </DrawerClose>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default TemplateNoteEditDrawer;
