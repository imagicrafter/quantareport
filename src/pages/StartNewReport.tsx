
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import StepIndicator from '@/components/report-workflow/StepIndicator';
import TemplateNotesForm from '@/components/report-workflow/TemplateNotesForm';
import { useTemplateData } from '@/hooks/report-workflow/useTemplateData';
import { useProjectData } from '@/hooks/report-workflow/useProjectData';
import { useReportSave } from '@/hooks/report-workflow/useReportSave';
import {
  ReportModeSelector,
  ReportNameInput,
  TemplateDisplay,
  ProjectSelector,
  ActionButtons,
  LoadingSpinner,
  InstructionsPanel
} from '@/components/report-workflow/start-report';

const StartNewReport = () => {
  const [reportMode, setReportMode] = useState<'new' | 'update'>('new');
  const { toast } = useToast();
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
    if (!defaultTemplate) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No template available. Please contact your administrator.',
      });
      return;
    }
    
    saveReport({
      reportMode,
      reportName,
      templateId: defaultTemplate.id,
      selectedProjectId,
      templateNotes,
      templateNoteValues
    });
  };
  
  const handleCancel = () => {
    resetForm();
    resetTemplateNoteValues();
  };

  const handleStepClick = (step: number) => {
    // In future implementations, this will navigate to the appropriate step
    toast({
      description: `Step ${step} will be implemented in a future update.`,
    });
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
    <div className="container mx-auto px-4 pt-16 pb-12">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        {reportMode === 'new' ? 'Start New Report' : 'Update Report'}
      </h1>
      
      {/* Step Indicator */}
      <div className="mb-8">
        <StepIndicator 
          currentStep={1}
          totalSteps={6}
          onStepClick={handleStepClick}
        />
      </div>
      
      {/* Instructions Panel */}
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
          <ActionButtons
            onSave={handleSave}
            onCancel={handleCancel}
            isSaving={isSaving}
            isDisabled={reportMode === 'update' && !selectedProjectId}
          />
        </>
      )}
    </div>
  );
};

export default StartNewReport;
