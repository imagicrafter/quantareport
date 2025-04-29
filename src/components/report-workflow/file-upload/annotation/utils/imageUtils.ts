
import { Annotation } from '../types';

export const convertStageToImage = async (stageRef: any, image: HTMLImageElement, annotations: Annotation[]): Promise<Blob | null> => {
  if (!stageRef.current) return null;

  // Get the stage's data URL
  const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });

  // Convert dataURL to Blob
  const response = await fetch(dataURL);
  const blob = await response.blob();
  return blob;
};

export const hasAnnotations = (annotations: Annotation[]): boolean => {
  return annotations.length > 0;
};

// A utility function to clear all annotations and reset state
export const resetAnnotationState = () => {
  return [];
};
