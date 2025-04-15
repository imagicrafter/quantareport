
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { submitImageAnalysis } from '@/utils/noteUtils';

export const useNoteAnalysis = (projectName: string) => {
  const { toast } = useToast();
  const [analyzingImages, setAnalyzingImages] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);

  const checkAnalysisStatus = async (noteId: string) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('analysis')
        .eq('id', noteId)
        .single();
        
      if (error) {
        console.error('Error fetching note status:', error);
        return { completed: false, analysis: null };
      }
      
      if (data && data.analysis) {
        return { completed: true, analysis: data.analysis };
      }
      
      return { completed: false, analysis: null };
    } catch (error) {
      console.error('Error checking analysis status:', error);
      return { completed: false, analysis: null };
    }
  };

  const startPollingForAnalysisCompletion = (
    noteId: string, 
    onComplete: (analysis: string) => void
  ) => {
    if (pollingInterval !== null) {
      clearInterval(pollingInterval);
    }
    
    const maxAttempts = 30;
    let attempts = 0;
    
    const intervalId = window.setInterval(async () => {
      attempts++;
      console.log(`Checking analysis status: attempt ${attempts}/${maxAttempts}`);
      
      const { completed, analysis } = await checkAnalysisStatus(noteId);
      
      if (completed && analysis) {
        clearInterval(intervalId);
        setPollingInterval(null);
        setAnalyzingImages(false);
        onComplete(analysis);
        
        toast({
          title: 'Success',
          description: 'Image analysis completed',
        });
      } else if (attempts >= maxAttempts) {
        clearInterval(intervalId);
        setPollingInterval(null);
        setAnalyzingImages(false);
        toast({
          title: 'Warning',
          description: 'Analysis is taking longer than expected. Please check back later.',
          variant: 'destructive',
        });
      }
    }, 2000);
    
    setPollingInterval(intervalId);
  };

  const handleAnalyzeImages = async (
    noteId: string,
    projectId: string,
    imageUrls: string[],
    onAnalysisComplete: (analysis: string) => void
  ) => {
    setAnalyzingImages(true);
    
    try {
      if (imageUrls.length === 0) {
        toast({
          title: 'Info',
          description: 'No images available for analysis. Add some images to analyze first.',
        });
        setAnalyzingImages(false);
        return;
      }
      
      const isTestMode = projectName.toLowerCase().includes('test');
      console.log(`Using ${isTestMode ? 'TEST' : 'PRODUCTION'} mode for project: ${projectName}`);
      
      const success = await submitImageAnalysis(
        noteId,
        projectId,
        imageUrls,
        isTestMode
      );
      
      if (!success) {
        throw new Error('Failed to submit image analysis request');
      }
      
      toast({
        title: 'Success',
        description: 'Image analysis started',
      });
      
      startPollingForAnalysisCompletion(noteId, onAnalysisComplete);
      
    } catch (error) {
      console.error('Error analyzing images:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze images',
        variant: 'destructive',
      });
      setAnalyzingImages(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pollingInterval !== null) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  return {
    analyzingImages,
    handleAnalyzeImages,
  };
};

