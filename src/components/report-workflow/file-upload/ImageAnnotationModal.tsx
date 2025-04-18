
import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ImageAnnotationModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageAnnotationModal = ({ imageUrl, isOpen, onClose }: ImageAnnotationModalProps) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image when URL changes
  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
    };
  }, [imageUrl]);

  // Handle zoom with mouse wheel
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    if (!stageRef.current) return;

    const stage = stageRef.current;
    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stagePosition.x) / oldScale,
      y: (pointer.y - stagePosition.y) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;

    // Limit zoom
    if (newScale < 0.1 || newScale > 5) return;

    setStageScale(newScale);
    setStagePosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // Calculate initial stage dimensions to fit the image
  const getInitialDimensions = () => {
    if (!image || !containerRef.current) return { width: 800, height: 600 };

    const container = containerRef.current;
    const containerRatio = container.clientWidth / container.clientHeight;
    const imageRatio = image.width / image.height;

    let width, height;

    if (containerRatio > imageRatio) {
      height = container.clientHeight * 0.9;
      width = height * imageRatio;
    } else {
      width = container.clientWidth * 0.9;
      height = width / imageRatio;
    }

    return { width, height };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-[900px] h-[80vh] max-h-[800px]">
        <DialogHeader>
          <DialogTitle>Image Annotation</DialogTitle>
        </DialogHeader>
        
        <div 
          ref={containerRef}
          className="flex-1 bg-muted/20 rounded-lg overflow-hidden"
          style={{ height: 'calc(100% - 40px)' }}
        >
          {image && (
            <Stage
              ref={stageRef}
              width={getInitialDimensions().width}
              height={getInitialDimensions().height}
              onWheel={handleWheel}
              draggable
              onDragEnd={(e) => {
                setStagePosition(e.currentTarget.position());
              }}
              scale={{ x: stageScale, y: stageScale }}
              position={stagePosition}
            >
              <Layer>
                <KonvaImage
                  image={image}
                  width={image.width}
                  height={image.height}
                />
              </Layer>
            </Stage>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageAnnotationModal;
