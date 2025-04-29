
import { useState, useRef } from 'react';
import { Stage } from 'konva/lib/Stage';
import { v4 as uuidv4 } from 'uuid';
import { Annotation, Point, AnnotationType, ArrowAnnotation, LineAnnotation, CircleAnnotation, RectangleAnnotation, TextAnnotation } from './types';

export const useDrawing = () => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedTool, setSelectedTool] = useState<AnnotationType | null>(null);
  const [selectedColor, setSelectedColor] = useState('#9b87f5');
  const stageRef = useRef<Stage | null>(null);
  const tempAnnotationRef = useRef<Partial<Annotation> | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement | null>(null);
  
  // Track past states for undo/redo
  const [history, setHistory] = useState<Annotation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

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
        tempAnnotationRef.current = {
          ...baseAnnotation,
          tool: 'arrow',
          points: [pos, pos],
        } as Partial<ArrowAnnotation>;
        break;
      case 'line':
        tempAnnotationRef.current = {
          ...baseAnnotation,
          tool: 'line',
          points: [pos, pos],
        } as Partial<LineAnnotation>;
        break;
      case 'circle':
        tempAnnotationRef.current = {
          ...baseAnnotation,
          tool: 'circle',
          center: pos,
          radius: 0,
        } as Partial<CircleAnnotation>;
        break;
      case 'rectangle':
        tempAnnotationRef.current = {
          ...baseAnnotation,
          tool: 'rectangle',
          start: pos,
          width: 0,
          height: 0,
        } as Partial<RectangleAnnotation>;
        break;
      case 'text':
        const textAnnotation = {
          ...baseAnnotation,
          tool: 'text',
          position: pos,
          content: '',
        } as TextAnnotation;
        
        // Add to annotations immediately
        setAnnotations(prev => {
          // Save current state to history before modifying
          saveToHistory(prev);
          return [...prev, textAnnotation];
        });
        
        // Show text input at position
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
      case 'line': {
        const annotation = tempAnnotationRef.current as Partial<ArrowAnnotation | LineAnnotation>;
        if (annotation.points) {
          annotation.points = [
            annotation.points[0],
            pos,
          ];
        }
        break;
      }
      case 'circle': {
        const annotation = tempAnnotationRef.current as Partial<CircleAnnotation>;
        if (annotation.center) {
          const dx = pos.x - annotation.center.x;
          const dy = pos.y - annotation.center.y;
          annotation.radius = Math.sqrt(dx * dx + dy * dy);
        }
        break;
      }
      case 'rectangle': {
        const annotation = tempAnnotationRef.current as Partial<RectangleAnnotation>;
        if (annotation.start) {
          annotation.width = pos.x - annotation.start.x;
          annotation.height = pos.y - annotation.start.y;
        }
        break;
      }
    }

    // Force a re-render
    setAnnotations(prev => [...prev]);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !tempAnnotationRef.current || !selectedTool) return;

    if (selectedTool !== 'text') {
      setAnnotations(prev => {
        // Save current state to history before adding new annotation
        saveToHistory(prev);
        return [...prev, tempAnnotationRef.current as Annotation];
      });
    }
    
    setIsDrawing(false);
    tempAnnotationRef.current = null;
  };

  const handleTextChange = (content: string) => {
    setAnnotations(prev => {
      // Find the most recently added text annotation
      const newAnnotations = [...prev];
      for (let i = newAnnotations.length - 1; i >= 0; i--) {
        const ann = newAnnotations[i];
        if (ann.tool === 'text') {
          // Type assertion to make TypeScript happy
          const textAnn = ann as TextAnnotation;
          newAnnotations[i] = { ...textAnn, content };
          break;
        }
      }
      return newAnnotations;
    });
  };

  // Save current state to history
  const saveToHistory = (currentState: Annotation[]) => {
    // Truncate future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, [...currentState]]);
    setHistoryIndex(newHistory.length);
  };

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = () => {
    if (!canUndo) return;
    
    const previousState = history[historyIndex];
    setAnnotations([...previousState]);
    setHistoryIndex(historyIndex - 1);
  };

  const handleRedo = () => {
    if (!canRedo) return;
    
    const nextState = history[historyIndex + 1];
    setAnnotations([...nextState]);
    setHistoryIndex(historyIndex + 1);
  };

  const handleClear = () => {
    // Completely reset the state
    setAnnotations([]);
    setHistory([]);
    setHistoryIndex(-1);
    tempAnnotationRef.current = null;
    if (textInputRef.current) {
      textInputRef.current.style.display = 'none';
      textInputRef.current.value = '';
    }
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
