
import React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Square, Circle, Line, ArrowRight, Type, Undo2, Redo2, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

type AnnotationTool = 'select' | 'draw' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'text';

interface AnnotationToolbarProps {
  activeTool: AnnotationTool;
  activeColor: string;
  onToolChange: (tool: AnnotationTool) => void;
  onColorChange: (color: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

const COLORS = [
  '#000000', // Black
  '#ff0000', // Red
  '#00ff00', // Green
  '#0000ff', // Blue
  '#ffff00', // Yellow
  '#ff00ff', // Magenta
  '#00ffff', // Cyan
  '#ffffff', // White
  '#ffa500', // Orange
  '#800080', // Purple
];

export const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
  activeTool,
  activeColor,
  onToolChange,
  onColorChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}) => {
  return (
    <div className="p-2 border-b flex items-center gap-2 bg-secondary/10 overflow-x-auto">
      {/* Drawing Tools */}
      <Button
        variant={activeTool === 'select' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onToolChange('select')}
        title="Select"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3.5 2C3.22386 2 3 2.22386 3 2.5V12.5C3 12.7761 3.22386 13 3.5 13C3.77614 13 4 12.7761 4 12.5V2.5C4 2.22386 3.77614 2 3.5 2ZM7.5 2C7.22386 2 7 2.22386 7 2.5V12.5C7 12.7761 7.22386 13 7.5 13C7.77614 13 8 12.7761 8 12.5V2.5C8 2.22386 7.77614 2 7.5 2ZM11 2.5C11 2.22386 11.2239 2 11.5 2C11.7761 2 12 2.22386 12 2.5V12.5C12 12.7761 11.7761 13 11.5 13C11.2239 13 11 12.7761 11 12.5V2.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
        </svg>
      </Button>
      
      <Button
        variant={activeTool === 'draw' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onToolChange('draw')}
        title="Free Draw"
      >
        <Pencil size={16} />
      </Button>
      
      <Button
        variant={activeTool === 'line' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onToolChange('line')}
        title="Line"
      >
        <Line size={16} />
      </Button>
      
      <Button
        variant={activeTool === 'arrow' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onToolChange('arrow')}
        title="Arrow"
      >
        <ArrowRight size={16} />
      </Button>
      
      <Button
        variant={activeTool === 'rectangle' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onToolChange('rectangle')}
        title="Rectangle"
      >
        <Square size={16} />
      </Button>
      
      <Button
        variant={activeTool === 'circle' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onToolChange('circle')}
        title="Circle"
      >
        <Circle size={16} />
      </Button>
      
      <Button
        variant={activeTool === 'text' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onToolChange('text')}
        title="Text"
      >
        <Type size={16} />
      </Button>
      
      <Separator orientation="vertical" className="h-8" />
      
      {/* Color picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline"
            size="sm"
            className="w-8 h-8 p-1 rounded-md border-2"
            style={{ backgroundColor: activeColor }}
            title="Color Picker"
          />
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="grid grid-cols-5 gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                className={`w-8 h-8 rounded-md border-2 ${color === activeColor ? 'border-gray-900' : 'border-gray-300'}`}
                style={{ backgroundColor: color }}
                onClick={() => onColorChange(color)}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
      
      <Separator orientation="vertical" className="h-8" />
      
      {/* History controls */}
      <Button
        variant="outline"
        size="sm"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo"
      >
        <Undo2 size={16} />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo"
      >
        <Redo2 size={16} />
      </Button>
    </div>
  );
};
