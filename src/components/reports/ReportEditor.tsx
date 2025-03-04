
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
  const editorRef = useRef<any>(null);
  const autoSaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Load TinyMCE script
    const script = document.createElement('script');
    script.src = 'https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js';
    script.referrerPolicy = 'origin';
    script.onload = () => initializeEditor();
    document.head.appendChild(script);

    // Fetch report data
    const loadReport = async () => {
      try {
        const reportData = await fetchReportById(reportId);
        if (reportData) {
          setReport(reportData);
          setTitle(reportData.title);
        }
      } catch (error) {
        console.error('Error loading report:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();

    return () => {
      // Clean up TinyMCE and auto-save timer
      if (editorRef.current) {
        editorRef.current.remove();
      }
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [reportId]);

  useEffect(() => {
    // Initialize editor once report data is loaded
    if (!isLoading && !editorInitialized && window.tinymce) {
      initializeEditor();
    }
  }, [isLoading, editorInitialized]);

  const initializeEditor = () => {
    if (!window.tinymce || editorInitialized) return;

    window.tinymce.init({
      selector: '#report-editor',
      height: 600,
      menubar: 'file edit view insert format tools table help',
      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor',
        'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime',
        'media', 'table', 'code', 'help', 'wordcount'
      ],
      toolbar: 'undo redo | formatselect | ' +
        'bold italic backcolor | alignleft aligncenter ' +
        'alignright alignjustify | bullist numlist outdent indent | ' +
        'removeformat | image | help',
      content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; line-height: 1.6; }',
      setup: (editor: any) => {
        editorRef.current = editor;
        editor.on('init', () => {
          setEditorInitialized(true);
          if (report?.content) {
            editor.setContent(report.content);
          }
          
          // Set up auto-save every 60 seconds
          autoSaveTimerRef.current = window.setInterval(() => {
            handleSave(true);
          }, 60000);
        });
      }
    });
  };

  const handleSave = async (isAutoSave = false) => {
    if (!editorRef.current || !report) return;
    
    try {
      setIsSaving(true);
      const content = editorRef.current.getContent();
      
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

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[600px] w-full" />
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
