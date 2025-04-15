
import React, { useState, useEffect } from 'react';
import { Expand, Trash, Sparkles } from 'lucide-react';
import { Note, NoteFileRelationshipWithType } from '@/utils/noteUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import AudioRecorder from '../files/AudioRecorder';
import FilePicker from './FilePicker';
import RelatedFiles from './RelatedFiles';

interface ExpandableNoteProps {
  note: Note;
  onDelete: (note: Note) => void;
  onUpdateNote: (note: Note, values: { title: string; content: string; analysis: string }) => void;
  onAnalyzeImages: () => void;
  onTranscriptionComplete: (text: string) => void;
  analyzingImages: boolean;
  projectId: string;
  relatedFiles: NoteFileRelationshipWithType[];
  onFileAdded: () => void;
  isLocked: boolean;
  onLockToggle: (locked: boolean) => void;
}

const ExpandableNote = ({
  note,
  onDelete,
  onUpdateNote,
  onAnalyzeImages,
  onTranscriptionComplete,
  analyzingImages,
  projectId,
  relatedFiles,
  onFileAdded,
  isLocked,
  onLockToggle
}: ExpandableNoteProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content || '');
  const [analysis, setAnalysis] = useState(note.analysis || '');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content || '');
    setAnalysis(note.analysis || '');
  }, [note]);

  const handleSave = () => {
    onUpdateNote(note, {
      title,
      content,
      analysis,
    });
  };

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className="w-full space-y-2"
    >
      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
        <div className="flex-1">
          <div className="font-medium">{note.title}</div>
          <div className="text-sm text-muted-foreground">
            {new Date(note.created_at || '').toLocaleDateString()}
          </div>
        </div>
        <div className="flex space-x-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 hover:bg-secondary transition-colors"
            >
              <Expand size={16} />
            </Button>
          </CollapsibleTrigger>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 hover:bg-secondary transition-colors"
            onClick={() => onDelete(note)}
          >
            <Trash size={16} />
          </Button>
        </div>
      </div>

      <CollapsibleContent className="space-y-4 p-4 border rounded-lg mt-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Finding</label>
              {!isRecording && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRecording(true)}
                  className="h-6 px-2 text-xs"
                >
                  Record Audio
                </Button>
              )}
            </div>
            {isRecording ? (
              <div className="mb-4">
                <AudioRecorder onTranscriptionComplete={onTranscriptionComplete} />
                <Button 
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsRecording(false)}
                  className="mt-2"
                >
                  Cancel Recording
                </Button>
              </div>
            ) : (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={handleSave}
                className="min-h-[100px]"
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Analysis</label>
              {relatedFiles.some(file => file.file_type === 'image') && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={onAnalyzeImages}
                  disabled={analyzingImages}
                >
                  <Sparkles size={16} />
                  <span>
                    {analyzingImages ? 'Analyzing...' : 'Analyze'}
                  </span>
                </Button>
              )}
            </div>
            <Textarea
              value={analysis}
              onChange={(e) => setAnalysis(e.target.value)}
              onBlur={handleSave}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Related Files ({relatedFiles.length})
              </label>
              <FilePicker
                projectId={projectId}
                noteId={note.id}
                onFileAdded={onFileAdded}
                relatedFiles={relatedFiles}
                isLocked={isLocked}
                onLockToggle={onLockToggle}
              />
            </div>
            <RelatedFiles 
              files={relatedFiles}
              compact={true}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ExpandableNote;
