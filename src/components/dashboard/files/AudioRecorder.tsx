
import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

const AudioRecorder = ({ onTranscriptionComplete }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  const { toast } = useToast();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      // Clean up when component unmounts
      stopRecording();
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Create new media recorder instance
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Reset state
      setAudioChunks([]);
      setRecordingTime(0);
      setIsRecording(true);
      setIsPaused(false);
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };
      
      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Recording Error',
        description: 'Could not access your microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    
    // Stop media recorder
    if (mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear timer
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
    setIsPaused(false);
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      stopRecording();
      
      if (audioChunks.length > 0) {
        await processAudio();
      }
    } else {
      startRecording();
    }
  };

  const processAudio = async () => {
    if (audioChunks.length === 0) return;
    
    try {
      setIsProcessing(true);
      
      // Create blob from chunks
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      
      // Convert to base64
      const base64Audio = await convertBlobToBase64(audioBlob);
      
      // Call Supabase Edge Function for transcription
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio }
      });
      
      if (error) {
        throw error;
      }
      
      if (data.text) {
        onTranscriptionComplete(data.text);
        toast({
          title: 'Transcription Complete',
          description: 'Audio has been transcribed.',
        });
      } else {
        throw new Error('No transcription returned');
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: 'Transcription Error',
        description: 'Failed to transcribe audio. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={handleToggleRecording}
          disabled={isProcessing}
          variant={isRecording ? "destructive" : "default"}
          size="sm"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : isRecording ? (
            <>
              <Square className="h-4 w-4 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 mr-2" />
              Record
            </>
          )}
        </Button>
        
        {isRecording && (
          <div className="flex items-center text-sm">
            <span className="animate-pulse mr-2">●</span>
            <span>{formatTime(recordingTime)}</span>
          </div>
        )}
      </div>
      
      {isProcessing && (
        <p className="text-sm text-muted-foreground animate-pulse">
          Transcribing your audio...
        </p>
      )}
    </div>
  );
};

export default AudioRecorder;
