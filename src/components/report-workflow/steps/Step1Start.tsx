
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InstructionsPanel from '../start-report/InstructionsPanel';
import ReportModeSelector from '../start-report/ReportModeSelector';
import ReportNameInput from '../start-report/ReportNameInput';
import TemplateDisplay from '../start-report/TemplateDisplay';
import ProjectSelector from '../start-report/ProjectSelector';
import LoadingSpinner from '../start-report/LoadingSpinner';
import TemplateNotesForm from '../TemplateNotesForm';
import { useTemplateData } from '@/hooks/report-workflow/useTemplateData';
import { useProjectData } from '@/hooks/report-workflow/useProjectData';
import { useReportSave } from '@/hooks/report-workflow/useReportSave';
import { Button } from '@/components/ui/button';

const Step1Start = () => {
  const [reportMode, setReportMode] = useState<'new' | 'update'>('new');
  const navigate = useNavigate();
  
  // Custom hooks for data and operations
  const {
    defaultTemplate,
    isLoading,
    templateNotes,
    templateNoteValues,
    setTemplateNotes,
    setTemplateNoteValues,
    handleInputChange,
    resetTemplateNoteValues,
    fetchDefaultTemplate
  } = useTemplateData();
  
  const {
    existingProjects,
    selectedProjectId,
    reportName,
    setSelectedProjectId,
    setReportName,
    handleProjectSelect,
    resetForm
  } = useProjectData();
  
  const { isSaving, saveReport } = useReportSave();
  
  // Reset form when report mode changes
  useEffect(() => {
    if (reportMode === 'new') {
      // Reset form to initial state
      resetForm();
      resetTemplateNoteValues();
    }
  }, [reportMode]);

  // Separate useEffect for fetching template
  useEffect(() => {
    if (reportMode === 'new' && defaultTemplate?.id) {
      fetchDefaultTemplate();
    }
  }, [reportMode, defaultTemplate?.id]);
  
  const handleReportModeChange = (mode: 'new' | 'update') => {
    setReportMode(mode);
    // The form reset is handled in the useEffect
  };
  
  const handleSave = () => {
    saveReport({
      reportMode,
      reportName,
      templateId: defaultTemplate?.id,
      selectedProjectId,
      templateNotes,
      templateNoteValues
    });
    // Navigation is now handled inside the saveReport function
  };
  
  const handleCancel = () => {
    resetForm();
    resetTemplateNoteValues();
  };

  const handleProjectSelection = (projectId: string) => {
    handleProjectSelect(
      projectId, 
      (loading: boolean) => isLoading, 
      (template: any) => defaultTemplate, 
      setTemplateNotes, 
      setTemplateNoteValues
    );
  };

  return (
    <div>
      <InstructionsPanel stepNumber={1} />
      
      {/* Report Mode Selection */}
      <ReportModeSelector 
        value={reportMode}
        onChange={handleReportModeChange}
      />
      
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Report Name and Template Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-3xl mx-auto">
            <div>
              {reportMode === 'new' ? (
                <ReportNameInput 
                  value={reportName}
                  onChange={setReportName}
                />
              ) : (
                <ProjectSelector
                  projects={existingProjects}
                  selectedId={selectedProjectId}
                  onSelect={handleProjectSelection}
                />
              )}
            </div>
            <TemplateDisplay templateName={defaultTemplate?.name} />
          </div>
          
          {/* Template Notes Form - shown for both modes when data is available */}
          {(reportMode === 'new' || (reportMode === 'update' && selectedProjectId)) && (
            <>
              {templateNotes.length > 0 ? (
                <TemplateNotesForm
                  templateNotes={templateNotes}
                  values={templateNoteValues}
                  onChange={handleInputChange}
                />
              ) : (
                <div className="text-center py-4 bg-accent/30 rounded-md max-w-3xl mx-auto">
                  <p>No template notes available.</p>
                </div>
              )}
            </>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-between max-w-3xl mx-auto mt-8">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={(reportMode === 'update' && !selectedProjectId) || isSaving}
            >
              {isSaving ? (
                <>
                  <span className="mr-2">Saving</span>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </>
              ) : (
                'Next: Upload Files'
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Step1Start;
