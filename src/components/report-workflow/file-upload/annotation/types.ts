
export type AnnotationType = 'arrow' | 'line' | 'circle' | 'rectangle' | 'text';

export interface Point {
  x: number;
  y: number;
}

export interface BaseAnnotation {
  id: string;
  tool: AnnotationType;
  color: string;
}

export interface ArrowAnnotation extends BaseAnnotation {
  tool: 'arrow';
  points: [Point, Point];
}

export interface LineAnnotation extends BaseAnnotation {
  tool: 'line';
  points: [Point, Point];
}

export interface CircleAnnotation extends BaseAnnotation {
  tool: 'circle';
  center: Point;
  radius: number;
}

export interface RectangleAnnotation extends BaseAnnotation {
  tool: 'rectangle';
  start: Point;
  width: number;
  height: number;
}

export interface TextAnnotation extends BaseAnnotation {
  tool: 'text';
  position: Point;
  content: string;
}

export type Annotation = 
  | ArrowAnnotation 
  | LineAnnotation 
  | CircleAnnotation 
  | RectangleAnnotation 
  | TextAnnotation;
