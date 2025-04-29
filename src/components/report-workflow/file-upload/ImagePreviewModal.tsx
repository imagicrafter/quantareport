
import { useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useImageViewer } from './annotation/useImageViewer';

interface ImagePreviewModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImagePreviewModal = ({ imageUrl, isOpen, onClose }: ImagePreviewModalProps) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const { stageRef, scale, handleWheel, handleDragStart, handleDragEnd } = useImageViewer();

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
          <DialogTitle>Image Preview</DialogTitle>
        </DialogHeader>

        <div className="flex-1 bg-muted/20 rounded-lg overflow-hidden relative">
          {image && (
            <Stage
              ref={stageRef}
              width={dimensions.width}
              height={dimensions.height}
              onWheel={handleWheel}
              draggable
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              scale={{ x: scale, y: scale }}
            >
              <Layer>
                <KonvaImage
                  image={image}
                  width={dimensions.width}
                  height={dimensions.height}
                />
              </Layer>
            </Stage>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewModal;
