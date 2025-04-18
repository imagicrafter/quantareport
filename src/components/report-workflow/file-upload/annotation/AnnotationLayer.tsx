
import { Layer, Arrow, Line, Circle, Rect, Text } from 'react-konva';
import { Annotation } from './types';

interface AnnotationLayerProps {
  annotations: Annotation[];
  tempAnnotation: Partial<Annotation> | null;
}

export const AnnotationLayer = ({ annotations, tempAnnotation }: AnnotationLayerProps) => {
  const renderAnnotation = (annotation: Annotation | Partial<Annotation>) => {
    if (!annotation.tool || !annotation.color) return null;

    switch (annotation.tool) {
      case 'arrow':
        if (!('points' in annotation)) return null;
        return (
          <Arrow
            key={annotation.id}
            points={[
              annotation.points[0].x,
              annotation.points[0].y,
              annotation.points[1].x,
              annotation.points[1].y,
            ]}
            pointerLength={10}
            pointerWidth={10}
            stroke={annotation.color}
            strokeWidth={2}
          />
        );

      case 'line':
        if (!('points' in annotation)) return null;
        return (
          <Line
            key={annotation.id}
            points={[
              annotation.points[0].x,
              annotation.points[0].y,
              annotation.points[1].x,
              annotation.points[1].y,
            ]}
            stroke={annotation.color}
            strokeWidth={2}
          />
        );

      case 'circle':
        if (!('center' in annotation) || !('radius' in annotation)) return null;
        return (
          <Circle
            key={annotation.id}
            x={annotation.center.x}
            y={annotation.center.y}
            radius={annotation.radius}
            stroke={annotation.color}
            strokeWidth={2}
          />
        );

      case 'rectangle':
        if (!('start' in annotation) || !('width' in annotation) || !('height' in annotation)) return null;
        return (
          <Rect
            key={annotation.id}
            x={annotation.start.x}
            y={annotation.start.y}
            width={annotation.width}
            height={annotation.height}
            stroke={annotation.color}
            strokeWidth={2}
          />
        );

      case 'text':
        if (!('position' in annotation) || !('content' in annotation)) return null;
        return (
          <Text
            key={annotation.id}
            x={annotation.position.x}
            y={annotation.position.y}
            text={annotation.content}
            fill={annotation.color}
            fontSize={16}
          />
        );
    }
  };

  return (
    <Layer>
      {annotations.map(renderAnnotation)}
      {tempAnnotation && renderAnnotation(tempAnnotation)}
    </Layer>
  );
};
