
import { useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnnotationToolbar } from './annotation/AnnotationToolbar';
import { AnnotationLayer } from './annotation/AnnotationLayer';
import { useDrawing } from './annotation/useDrawing';

interface ImageAnnotationModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageAnnotationModal = ({ imageUrl, isOpen, onClose }: ImageAnnotationModalProps) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
      </DialogContent>
    </Dialog>
  );
};

export default ImageAnnotationModal;
