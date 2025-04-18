
import { useState, useRef } from 'react';
import { Stage } from 'konva/lib/Stage';
import { v4 as uuidv4 } from 'uuid';
import { Annotation, Point, AnnotationType } from './types';

export const useDrawing = () => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedTool, setSelectedTool] = useState<AnnotationType | null>(null);
  const [selectedColor, setSelectedColor] = useState('#9b87f5');
  const stageRef = useRef<Stage | null>(null);
  const tempAnnotationRef = useRef<Partial<Annotation> | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement | null>(null);

  const getPointerPosition = (e: any): Point => {
    if (!stageRef.current) return { x: 0, y: 0 };
    const stage = stageRef.current;
    const point = stage.getPointerPosition();
    return point ? { x: point.x, y: point.y } : { x: 0, y: 0 };
  };

  const handleMouseDown = (e: any) => {
    if (!selectedTool) return;

    const pos = getPointerPosition(e);
    setIsDrawing(true);

    const baseAnnotation = {
      id: uuidv4(),
      tool: selectedTool,
      color: selectedColor,
    };

    switch (selectedTool) {
      case 'arrow':
      case 'line':
        tempAnnotationRef.current = {
          ...baseAnnotation,
          points: [pos, pos],
        };
        break;
      case 'circle':
        tempAnnotationRef.current = {
          ...baseAnnotation,
          center: pos,
          radius: 0,
        };
        break;
      case 'rectangle':
        tempAnnotationRef.current = {
          ...baseAnnotation,
          start: pos,
          width: 0,
          height: 0,
        };
        break;
      case 'text':
        const textAnnotation = {
          ...baseAnnotation,
          tool: 'text' as const,
          position: pos,
          content: '',
        };
        setAnnotations(prev => [...prev, textAnnotation]);
        if (textInputRef.current) {
          textInputRef.current.style.left = `${pos.x}px`;
          textInputRef.current.style.top = `${pos.y}px`;
          textInputRef.current.style.display = 'block';
          textInputRef.current.focus();
        }
        break;
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || !tempAnnotationRef.current || !selectedTool) return;

    const pos = getPointerPosition(e);

    switch (selectedTool) {
      case 'arrow':
      case 'line':
        tempAnnotationRef.current.points = [
          (tempAnnotationRef.current.points as [Point, Point])[0],
          pos,
        ];
        break;
      case 'circle': {
        const center = (tempAnnotationRef.current as any).center;
        const dx = pos.x - center.x;
        const dy = pos.y - center.y;
        tempAnnotationRef.current.radius = Math.sqrt(dx * dx + dy * dy);
        break;
      }
      case 'rectangle': {
        const start = (tempAnnotationRef.current as any).start;
        tempAnnotationRef.current.width = pos.x - start.x;
        tempAnnotationRef.current.height = pos.y - start.y;
        break;
      }
    }

    // Force a re-render
    setAnnotations(prev => [...prev]);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !tempAnnotationRef.current || !selectedTool) return;

    if (selectedTool !== 'text') {
      setAnnotations(prev => [...prev, tempAnnotationRef.current as Annotation]);
    }
    
    setIsDrawing(false);
    tempAnnotationRef.current = null;
  };

  const handleTextChange = (content: string) => {
    setAnnotations(prev =>
      prev.map(ann =>
        ann.tool === 'text' && !('content' in ann)
          ? { ...ann, content }
          : ann
      )
    );
  };

  const canUndo = annotations.length > 0;
  const canRedo = false; // To be implemented

  const handleUndo = () => {
    setAnnotations(prev => prev.slice(0, -1));
  };

  const handleRedo = () => {
    // To be implemented
  };

  const handleClear = () => {
    setAnnotations([]);
  };

  return {
    annotations,
    selectedTool,
    selectedColor,
    isDrawing,
    stageRef,
    textInputRef,
    tempAnnotationRef,
    canUndo,
    canRedo,
    setSelectedTool,
    setSelectedColor,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTextChange,
    handleUndo,
    handleRedo,
    handleClear,
  };
};
