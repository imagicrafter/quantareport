
import { useState, useEffect } from 'react';
import { Canvas } from 'fabric';

type AnnotationTool = 'select' | 'draw' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'text';

type HistoryEntry = {
  json: string;
};

export const useAnnotationTools = (canvas: Canvas | null) => {
  const [activeTool, setActiveTool] = useState<AnnotationTool>('select');
  const [activeColor, setActiveColor] = useState('#FF0000');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Save canvas state to history when object is added or modified
  useEffect(() => {
    if (!canvas) return;

    const handleObjectModified = () => {
      const json = JSON.stringify(canvas.toJSON());
      
      // If we're not at the end of history (user has performed undo operations)
      // then trim the future history
      if (historyIndex < history.length - 1) {
        setHistory(prev => prev.slice(0, historyIndex + 1));
      }
      
      setHistory(prev => [...prev, { json }]);
      setHistoryIndex(prev => prev + 1);
    };

    canvas.on('object:added', handleObjectModified);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:removed', handleObjectModified);

    return () => {
      canvas.off('object:added', handleObjectModified);
      canvas.off('object:modified', handleObjectModified);
      canvas.off('object:removed', handleObjectModified);
    };
  }, [canvas, history, historyIndex]);

  const handleToolChange = (tool: AnnotationTool) => {
    setActiveTool(tool);
    
    if (canvas) {
      // Disable object selection when tool isn't select
      canvas.selection = tool === 'select';
      
      // Make all objects selectable only when in select mode
      canvas.getObjects().forEach(obj => {
        obj.selectable = tool === 'select';
        obj.evented = tool === 'select';
      });
    }
  };

  const handleColorChange = (color: string) => {
    setActiveColor(color);
  };

  const undoOperation = () => {
    if (!canvas || historyIndex <= 0) return;
    
    setHistoryIndex(prev => prev - 1);
    const newIndex = historyIndex - 1;
    
    if (newIndex >= 0) {
      canvas.loadFromJSON(history[newIndex].json, canvas.renderAll.bind(canvas));
    } else {
      // If we're undoing to before any changes, just clear the canvas
      canvas.clear();
      canvas.renderAll();
    }
  };

  const redoOperation = () => {
    if (!canvas || historyIndex >= history.length - 1) return;
    
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    
    canvas.loadFromJSON(history[newIndex].json, canvas.renderAll.bind(canvas));
  };

  const clearHistory = () => {
    setHistory([]);
    setHistoryIndex(-1);
  };

  return {
    activeTool,
    activeColor,
    handleToolChange,
    handleColorChange,
    undoOperation,
    redoOperation,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    clearHistory
  };
};
