
import { useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { AnnotationToolbar } from './annotation/AnnotationToolbar';
import { AnnotationLayer } from './annotation/AnnotationLayer';
import { useDrawing } from './annotation/useDrawing';
import { convertStageToImage, hasAnnotations } from './annotation/utils/imageUtils';
import { Save } from 'lucide-react';

interface ImageAnnotationModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (annotatedImage: Blob) => Promise<void>;
}

const ImageAnnotationModal = ({ imageUrl, isOpen, onClose, onSave }: ImageAnnotationModalProps) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  const {
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
  } = useDrawing();

  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
      const scale = Math.min(800 / img.width, 600 / img.height);
      setDimensions({
        width: img.width * scale,
        height: img.height * scale,
      });
    };
  }, [imageUrl]);

  // Clear annotations when the modal is closed
  const handleClose = () => {
    handleClear(); // Clear all annotations
    onClose();
  };

  const handleSaveClick = async () => {
    if (!image || !hasAnnotations(annotations)) {
      toast({
        variant: "destructive",
        title: "No annotations",
        description: "Please add annotations before saving.",
      });
      return;
    }

    try {
      setIsSaving(true);
      const annotatedImage = await convertStageToImage(stageRef, image, annotations);
      
      if (!annotatedImage) {
        throw new Error("Failed to generate annotated image");
      }
      
      await onSave(annotatedImage);
      toast({
        title: "Success",
        description: "Image annotations saved successfully",
      });
      handleClose(); // Use handleClose instead of onClose to also clear annotations
    } catch (error) {
      console.error('Error saving annotations:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save annotations. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[90vw] w-[900px] h-[80vh] max-h-[800px]">
        <DialogHeader>
          <DialogTitle>Image Annotation</DialogTitle>
        </DialogHeader>
        
        <div className="mb-4">
          <AnnotationToolbar
            selectedTool={selectedTool}
            selectedColor={selectedColor}
            canUndo={canUndo}
            canRedo={canRedo}
            onToolSelect={setSelectedTool}
            onColorChange={setSelectedColor}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClear={handleClear}
          />
        </div>

        <div className="flex-1 bg-muted/20 rounded-lg overflow-hidden relative">
          {image && (
            <Stage
              ref={stageRef}
              width={dimensions.width}
              height={dimensions.height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <Layer>
                <KonvaImage
                  image={image}
                  width={dimensions.width}
                  height={dimensions.height}
                />
              </Layer>
              <AnnotationLayer
                annotations={annotations}
                tempAnnotation={tempAnnotationRef.current}
              />
            </Stage>
          )}
          {selectedTool === 'text' && (
            <textarea
              ref={textInputRef}
              className="absolute hidden p-2 border rounded bg-white"
              onChange={(e) => handleTextChange(e.target.value)}
              onBlur={() => {
                if (textInputRef.current) {
                  textInputRef.current.style.display = 'none';
                }
              }}
            />
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button 
            variant="outline" 
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveClick}
            disabled={isSaving || !hasAnnotations(annotations)}
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Annotations
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageAnnotationModal;
