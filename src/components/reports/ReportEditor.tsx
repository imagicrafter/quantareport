
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Report, updateReport, fetchReportById, exportToWord, exportToGoogleDocs } from './ReportService';
import { Save, FileDown, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

// Define TinyMCE global
declare global {
  interface Window {
    tinymce: any;
  }
}

interface ReportEditorProps {
  reportId: string;
}

const ReportEditor = ({ reportId }: ReportEditorProps) => {
  const [report, setReport] = useState<Report | null>(null);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editorInitialized, setEditorInitialized] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
  const autoSaveTimerRef = useRef<number | null>(null);
  const contentLoadAttempts = useRef(0);
  const maxLoadAttempts = 3;

  useEffect(() => {
    // Load TinyMCE script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tinymce@6.8.3/tinymce.min.js';
    script.referrerPolicy = 'origin';
    script.onload = () => {
      console.log('TinyMCE script loaded');
      if (!isLoading && report) {
        initializeEditor();
      }
    };
    document.head.appendChild(script);

    // Fetch report data
    const loadReport = async () => {
      try {
        console.log('Fetching report with ID:', reportId);
        setLoadError(null);
        const reportData = await fetchReportById(reportId);
        
        if (reportData) {
          console.log('Report data loaded:', reportData);
          setReport(reportData);
          setTitle(reportData.title);
        } else {
          setLoadError('Report not found');
        }
      } catch (error) {
        console.error('Error loading report:', error);
        setLoadError('Failed to load report');
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();

    return () => {
      // Clean up TinyMCE and auto-save timer
      if (editorRef.current) {
        console.log('Removing TinyMCE editor');
        editorRef.current.remove();
      }
      if (autoSaveTimerRef.current) {
        console.log('Clearing auto-save timer');
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [reportId]);

  useEffect(() => {
    // Initialize editor once report data is loaded and TinyMCE is available
    if (!isLoading && report && window.tinymce && !editorInitialized) {
      console.log('Initializing editor with report:', report.title);
      initializeEditor();
    }
  }, [isLoading, report, editorInitialized]);

  const initializeEditor = () => {
    if (!window.tinymce || editorInitialized) {
      console.log('TinyMCE not available or editor already initialized');
      return;
    }

    console.log('Setting up TinyMCE editor');
    window.tinymce.init({
      selector: '#report-editor',
      height: 600,
      menubar: 'file edit view insert format tools table help',
      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor',
        'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime',
        'media', 'table', 'code', 'help', 'wordcount', 'autosave'
      ],
      toolbar: 'undo redo | formatselect | ' +
        'bold italic backcolor | alignleft aligncenter ' +
        'alignright alignjustify | bullist numlist outdent indent | ' +
        'removeformat | image | help',
      content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; line-height: 1.6; }',
      setup: (editor: any) => {
        editorRef.current = editor;
        
        editor.on('init', () => {
          console.log('TinyMCE initialized');
          setEditorInitialized(true);
          
          if (report?.content) {
            console.log('Setting editor content');
            editor.setContent(report.content);
          } else {
            console.log('No report content to set');
          }
          
          // Set up auto-save every 60 seconds
          autoSaveTimerRef.current = window.setInterval(() => {
            handleSave(true);
          }, 60000);
        });
        
        // Add content change handler
        editor.on('change', () => {
          console.log('Content changed in editor');
        });
      }
    });
  };

  const handleSave = async (isAutoSave = false) => {
    if (!editorRef.current || !report) {
      console.log('Editor or report not available for saving');
      return;
    }
    
    try {
      setIsSaving(true);
      const content = editorRef.current.getContent();
      console.log(`Saving report ${isAutoSave ? '(auto-save)' : ''}`);
      
      await updateReport(reportId, {
        title,
        content
      });
      
      if (!isAutoSave) {
        toast.success('Report saved successfully');
      } else {
        // Show a more subtle notification for auto-save
        toast('Report auto-saved', {
          duration: 2000,
          icon: <Save className="h-4 w-4" />
        });
      }
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = (type: 'word' | 'google-docs') => {
    if (!report) return;
    
    if (type === 'word') {
      exportToWord(report);
    } else {
      exportToGoogleDocs(report);
    }
  };

  // Function to retry loading content if it fails
  const retryLoadContent = async () => {
    if (contentLoadAttempts.current >= maxLoadAttempts) {
      setLoadError(`Failed to load report content after ${maxLoadAttempts} attempts`);
      return;
    }
    
    contentLoadAttempts.current += 1;
    setIsLoading(true);
    
    try {
      const reportData = await fetchReportById(reportId);
      if (reportData) {
        setReport(reportData);
        setTitle(reportData.title);
        setLoadError(null);
        
        // If editor is already initialized, set content
        if (editorRef.current) {
          editorRef.current.setContent(reportData.content || '');
        }
      } else {
        setLoadError('Report not found');
      }
    } catch (error) {
      console.error(`Retry ${contentLoadAttempts.current} failed:`, error);
      setLoadError(`Failed to load report. Attempts: ${contentLoadAttempts.current}/${maxLoadAttempts}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center p-6 border rounded-md bg-amber-50 text-amber-800">
          <AlertCircle className="h-8 w-8 mb-4" />
          <span className="text-lg mb-4">{loadError}</span>
          <Button onClick={retryLoadContent} variant="outline">
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center p-4 border rounded-md bg-amber-50 text-amber-800">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Report not found or you don't have permission to view it.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 mr-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Report Title"
            className="text-xl font-semibold"
          />
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => handleSave()}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileDown className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('word')}>
                <FileText className="h-4 w-4 mr-2" />
                Export to Word
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('google-docs')}>
                <FileText className="h-4 w-4 mr-2" />
                Export to Google Docs
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="border rounded-md p-1">
        <textarea id="report-editor" />
      </div>
    </div>
  );
};

export default ReportEditor;
