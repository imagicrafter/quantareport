
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Canvas, Circle, Rect, Line, IText } from 'fabric';
import { useAnnotationTools } from '@/hooks/useAnnotationTools';
import { AnnotationToolbar } from './AnnotationToolbar';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { saveAnnotatedImage } from '@/services/imageAnnotationService';

interface ImageAnnotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  projectId: string;
  fileId: string;
  fileName: string;
}

export const ImageAnnotationModal: React.FC<ImageAnnotationModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  projectId,
  fileId,
  fileName
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);
  const [hasAnnotations, setHasAnnotations] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const {
    activeTool,
    activeColor,
    handleToolChange,
    handleColorChange,
    undoOperation,
    redoOperation,
    canUndo,
    canRedo,
    clearHistory
  } = useAnnotationTools(fabricCanvas);

  // Initialize Canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    
    const canvas = new Canvas(canvasRef.current, {
      isDrawingMode: false,
      selection: true,
      backgroundColor: "#f5f5f5"
    });
    
    setFabricCanvas(canvas);
    
    return () => {
      canvas.dispose();
    };
  }, [isOpen]);
  
  // Load Image
  useEffect(() => {
    if (!fabricCanvas || !imageUrl) return;
    
    setIsLoading(true);
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    
    img.onload = () => {
      // Calculate sizing
      const containerWidth = canvasRef.current?.parentElement?.clientWidth || 800;
      const containerHeight = canvasRef.current?.parentElement?.clientHeight || 600;
      
      const imgRatio = img.width / img.height;
      let canvasWidth = img.width;
      let canvasHeight = img.height;
      
      if (img.width > containerWidth * 0.9) {
        canvasWidth = containerWidth * 0.9;
        canvasHeight = canvasWidth / imgRatio;
      }
      
      if (canvasHeight > containerHeight * 0.8) {
        canvasHeight = containerHeight * 0.8;
        canvasWidth = canvasHeight * imgRatio;
      }
      
      // Set canvas size
      fabricCanvas.setWidth(canvasWidth);
      fabricCanvas.setHeight(canvasHeight);
      
      // Set background image
      fabricCanvas.setBackgroundImage(
        imageUrl,
        fabricCanvas.renderAll.bind(fabricCanvas),
        {
          scaleX: canvasWidth / img.width,
          scaleY: canvasHeight / img.height,
          crossOrigin: 'anonymous'
        }
      );
      
      setIsLoading(false);
      clearHistory();
    };
    
    img.onerror = () => {
      toast.error("Failed to load image. Please try again.");
      setIsLoading(false);
      onClose();
    };
  }, [fabricCanvas, imageUrl]);
  
  // Handle tool interactions on canvas
  useEffect(() => {
    if (!fabricCanvas) return;
    
    fabricCanvas.isDrawingMode = activeTool === 'draw';
    
    if (fabricCanvas.isDrawingMode) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = 2;
    }
    
    // Track if there are annotations
    const handleObjectAdded = () => {
      setHasAnnotations(true);
    };
    
    fabricCanvas.on('object:added', handleObjectAdded);
    
    return () => {
      fabricCanvas.off('object:added', handleObjectAdded);
    };
  }, [fabricCanvas, activeTool, activeColor]);
  
  // Mouse down handler for various drawing tools
  const handleCanvasMouseDown = (event: React.MouseEvent) => {
    if (!fabricCanvas) return;
    
    const pointer = fabricCanvas.getPointer(event.nativeEvent);
    let obj;
    
    switch (activeTool) {
      case 'rectangle':
        obj = new Rect({
          left: pointer.x,
          top: pointer.y,
          width: 100,
          height: 60,
          fill: 'transparent',
          stroke: activeColor,
          strokeWidth: 2
        });
        fabricCanvas.add(obj);
        break;
        
      case 'circle':
        obj = new Circle({
          left: pointer.x,
          top: pointer.y,
          radius: 30,
          fill: 'transparent',
          stroke: activeColor,
          strokeWidth: 2
        });
        fabricCanvas.add(obj);
        break;
        
      case 'line':
        const linePoints: [number, number, number, number] = [pointer.x, pointer.y, pointer.x + 100, pointer.y];
        obj = new Line(linePoints, {
          stroke: activeColor,
          strokeWidth: 2
        });
        fabricCanvas.add(obj);
        break;
        
      case 'arrow':
        // Create arrow using line with custom render
        const arrowPoints: [number, number, number, number] = [pointer.x, pointer.y, pointer.x + 100, pointer.y];
        obj = new Line(arrowPoints, {
          stroke: activeColor,
          strokeWidth: 2
        });
        
        // Add arrow head using custom render
        obj.toSVG = (function(toSVG) {
          return function(this: any, ...args: any[]) {
            const svg = toSVG.apply(this, args);
            const p1 = this.calcLinePoints();
            const dx = p1.x2 - p1.x1;
            const dy = p1.y2 - p1.y1;
            const angle = Math.atan2(dy, dx);
            
            const x1 = p1.x2 - 15 * Math.cos(angle - Math.PI / 6);
            const y1 = p1.y2 - 15 * Math.sin(angle - Math.PI / 6);
            const x2 = p1.x2 - 15 * Math.cos(angle + Math.PI / 6);
            const y2 = p1.y2 - 15 * Math.sin(angle + Math.PI / 6);
            
            return svg.replace('</line>', `</line>
              <polyline points="${p1.x2},${p1.y2} ${x1},${y1} ${x2},${y2} ${p1.x2},${p1.y2}" 
                        fill="${this.stroke}" stroke="${this.stroke}" />`);
          };
        })(obj.toSVG);
        
        fabricCanvas.add(obj);
        break;
        
      case 'text':
        obj = new IText('Edit this text', {
          left: pointer.x,
          top: pointer.y,
          fontFamily: 'Arial',
          fill: activeColor,
          fontSize: 20
        });
        fabricCanvas.add(obj);
        break;
    }
    
    fabricCanvas.renderAll();
  };
  
  const handleSave = async () => {
    if (!fabricCanvas || !hasAnnotations) {
      onClose();
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Convert canvas to data URL
      const dataUrl = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1
      });
      
      // Create a file from data URL
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `${fileName.split('.')[0]}_annotated.png`, { type: 'image/png' });
      
      // Save the file
      await saveAnnotatedImage(file, projectId, fileId);
      
      toast.success("Annotated image saved successfully");
      onClose();
    } catch (error) {
      console.error("Error saving annotated image:", error);
      toast.error("Failed to save annotated image");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = () => {
    if (hasAnnotations) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleDelete()}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-secondary/20">
            <h2 className="text-xl font-semibold">Image Annotation</h2>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasAnnotations}
                size="sm"
              >
                {isSaving ? "Saving..." : "Save Annotated Image"}
              </Button>
            </div>
          </div>
          
          <AnnotationToolbar
            activeTool={activeTool}
            activeColor={activeColor}
            onToolChange={handleToolChange}
            onColorChange={handleColorChange}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undoOperation}
            onRedo={redoOperation}
          />
          
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-gray-100">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p>Loading image...</p>
              </div>
            ) : (
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  className="border shadow-lg bg-white"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved annotations. Are you sure you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowConfirmDialog(false);
              onClose();
            }}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
