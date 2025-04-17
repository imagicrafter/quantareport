import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Canvas, Circle, Rect, Line, IText } from 'fabric';
import { useAnnotationTools } from '@/hooks/useAnnotationTools';
import { AnnotationToolbar } from './AnnotationToolbar';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { saveAnnotatedImage } from '@/services/imageAnnotationService';

// Import fabric/Image specifically with a name to avoid conflicts
import { Image as FabricImage } from 'fabric';

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
  const [imgLoadError, setImgLoadError] = useState<string | null>(null);
  
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

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    
    console.log("Initializing canvas for annotation");
    const canvas = new Canvas(canvasRef.current, {
      isDrawingMode: false,
      selection: true,
      backgroundColor: "#f5f5f5"
    });
    
    setFabricCanvas(canvas);
    console.log("Canvas initialized:", canvas ? "success" : "failed");
    
    return () => {
      console.log("Disposing canvas");
      canvas.dispose();
    };
  }, [isOpen]);
  
  useEffect(() => {
    if (!fabricCanvas || !imageUrl) return;
    
    setIsLoading(true);
    setImgLoadError(null);
    
    console.log("Loading image details:", {
      imageUrl,
      fileId,
      fileName,
      projectId
    });
    
    const cacheBuster = `?t=${new Date().getTime()}`;
    const imageUrlWithCache = `${imageUrl}${cacheBuster}`;
    
    console.log("Attempting to load image from URL:", imageUrlWithCache);
    
    fetch(imageUrlWithCache, { method: 'HEAD' })
      .then(response => {
        console.log("Image URL status:", response.status, response.ok ? "OK" : "Failed");
        console.log("Content type:", response.headers.get('Content-Type'));
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
      })
      .catch(error => {
        console.error("Error checking image URL:", error);
        setImgLoadError(`Failed to access image: ${error.message}`);
      });
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      console.log("Image loaded successfully:", {
        width: img.width,
        height: img.height,
        complete: img.complete
      });
      
      try {
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
        
        console.log("Canvas dimensions set to:", { canvasWidth, canvasHeight });
        
        fabricCanvas.setWidth(canvasWidth);
        fabricCanvas.setHeight(canvasHeight);
        
        FabricImage.fromURL(imageUrlWithCache, { crossOrigin: 'anonymous' })
          .then(fabricImg => {
            console.log("FabricImage created from URL:", fabricImg ? "success" : "failed");
            
            if (!fabricImg) {
              setImgLoadError("Failed to create FabricImage object");
              setIsLoading(false);
              return;
            }
            
            fabricImg.scaleX = canvasWidth / img.width;
            fabricImg.scaleY = canvasHeight / img.height;
            
            fabricCanvas.backgroundImage = fabricImg;
            fabricCanvas.renderAll();
            
            console.log("Background image set successfully");
            setIsLoading(false);
            clearHistory();
          })
          .catch(error => {
            console.error("Error loading fabric image:", error);
            setImgLoadError(`Failed to load image: ${error.message}`);
            setIsLoading(false);
          });
      } catch (error) {
        console.error("Error creating Fabric image:", error);
        setImgLoadError(`Error setting up the canvas: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsLoading(false);
      }
    };
    
    img.onerror = (e) => {
      console.error("Failed to load image:", {
        error: e,
        imageUrl: imageUrlWithCache,
        imageElement: img
      });
      setImgLoadError(`Failed to load image from ${imageUrlWithCache}`);
      setIsLoading(false);
    };
    
    console.log("Setting image source:", imageUrlWithCache);
    img.src = imageUrlWithCache;
    
  }, [fabricCanvas, imageUrl, fileId]);
  
  useEffect(() => {
    if (!fabricCanvas) return;
    
    fabricCanvas.isDrawingMode = activeTool === 'draw';
    
    if (fabricCanvas.isDrawingMode) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = 2;
    }
    
    const handleObjectAdded = () => {
      setHasAnnotations(true);
    };
    
    fabricCanvas.on('object:added', handleObjectAdded);
    
    return () => {
      fabricCanvas.off('object:added', handleObjectAdded);
    };
  }, [fabricCanvas, activeTool, activeColor]);
  
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
        const arrowPoints: [number, number, number, number] = [pointer.x, pointer.y, pointer.x + 100, pointer.y];
        obj = new Line(arrowPoints, {
          stroke: activeColor,
          strokeWidth: 2
        });
        
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
      console.log("Starting image save process");
      
      const dataUrl = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1
      });
      console.log("Canvas converted to data URL, length:", dataUrl.length);
      
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `${fileName.split('.')[0]}_annotated.png`, { type: 'image/png' });
      console.log("File created:", { name: file.name, size: file.size, type: file.type });
      
      const newFileId = await saveAnnotatedImage(file, projectId, fileId);
      console.log("Annotated image saved with new ID:", newFileId);
      
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

  const handleReloadImage = () => {
    setIsLoading(true);
    setImgLoadError(null);
    
    setTimeout(() => {
      if (fabricCanvas && imageUrl) {
        const newCacheBuster = `?t=${new Date().getTime()}`;
        const refreshedUrl = `${imageUrl.split('?')[0]}${newCacheBuster}`;
        
        console.log("Attempting to reload image:", refreshedUrl);
        
        FabricImage.fromURL(refreshedUrl, { crossOrigin: 'anonymous' })
          .then(fabricImg => {
            if (fabricImg) {
              const canvasWidth = fabricCanvas.getWidth();
              const canvasHeight = fabricCanvas.getHeight();
              
              fabricImg.scaleX = canvasWidth / (fabricImg.width || 1);
              fabricImg.scaleY = canvasHeight / (fabricImg.height || 1);
              
              fabricCanvas.backgroundImage = fabricImg;
              fabricCanvas.renderAll();
              console.log("Image reload successful");
            }
            setIsLoading(false);
          })
          .catch(error => {
            console.error("Error reloading fabric image:", error);
            setImgLoadError(`Failed to reload image: ${error.message}`);
            setIsLoading(false);
          });
      }
    }, 500);
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
              <div className="flex flex-col items-center justify-center h-64 space-y-2">
                <p className="text-muted-foreground">Loading image...</p>
                <p className="text-xs text-muted-foreground">URL: {imageUrl}</p>
              </div>
            ) : imgLoadError ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-2 p-4 max-w-md">
                <p className="text-red-500 font-medium">Error loading image</p>
                <p className="text-sm text-muted-foreground">{imgLoadError}</p>
                <div className="text-xs text-muted-foreground mt-4 p-2 bg-gray-100 rounded-md overflow-auto max-w-full">
                  <p>Image URL: {imageUrl}</p>
                  <p>File ID: {fileId}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleReloadImage}
                >
                  Try Again
                </Button>
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
