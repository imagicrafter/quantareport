import { useState } from 'react';
import {
  ArrowRight,
  FlipHorizontal,  // Changed from LineHorizontal
  Circle,
  Square,
  Type,
  Undo2,
  Redo2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ColorPicker } from './ColorPicker';

export type AnnotationTool = 'arrow' | 'line' | 'circle' | 'rectangle' | 'text' | null;

interface AnnotationToolbarProps {
  selectedTool: AnnotationTool;
  selectedColor: string;
  canUndo: boolean;
  canRedo: boolean;
  onToolSelect: (tool: AnnotationTool) => void;
  onColorChange: (color: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

const tools = [
  { id: 'arrow', icon: ArrowRight, tooltip: 'Arrow Tool' },
  { id: 'line', icon: FlipHorizontal, tooltip: 'Line Tool' },
  { id: 'circle', icon: Circle, tooltip: 'Circle Tool' },
  { id: 'rectangle', icon: Square, tooltip: 'Rectangle Tool' },
  { id: 'text', icon: Type, tooltip: 'Text Tool' },
] as const;

export const AnnotationToolbar = ({
  selectedTool,
  selectedColor,
  canUndo,
  canRedo,
  onToolSelect,
  onColorChange,
  onUndo,
  onRedo,
  onClear
}: AnnotationToolbarProps) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-background border rounded-lg shadow-sm">
      <TooltipProvider>
        {tools.map(({ id, icon: Icon, tooltip }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <Button
                variant={selectedTool === id ? "secondary" : "ghost"}
                size="icon"
                onClick={() => onToolSelect(id as AnnotationTool)}
                className="w-8 h-8"
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        <div className="w-px h-6 bg-border mx-2" />
        
        <ColorPicker
          selectedColor={selectedColor}
          onColorChange={onColorChange}
        />

        <div className="w-px h-6 bg-border mx-2" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndo}
              disabled={!canUndo}
              className="w-8 h-8"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Undo</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRedo}
              disabled={!canRedo}
              className="w-8 h-8"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Redo</p>
          </TooltipContent>
        </Tooltip>

        <AlertDialog>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear All</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear All Annotations?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All annotations will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onClear}>Clear All</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TooltipProvider>
    </div>
  );
};
