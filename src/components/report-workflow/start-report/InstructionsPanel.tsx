
interface InstructionsPanelProps {
  stepNumber: number;
}

const InstructionsPanel = ({ stepNumber }: InstructionsPanelProps) => {
  const getStepInstructions = (step: number) => {
    switch (step) {
      case 1:
        return "Step 1: Initiate your report by giving it a name. Use the form below to start creating a new report or select an existing one to update.";
      case 2:
        return "Step 2: Upload images and documents relevant to your report. These will be processed and analyzed automatically.";
      case 3:
        return "Step 3: Review the analysis of your uploaded files. AI will help identify key information from your documents.";
      case 4:
        return "Step 4: Review and edit notes that will be included in your report. Add any additional observations.";
      case 5:
        return "Step 5: Generate your report based on the collected information and notes.";
      case 6:
        return "Step 6: Review and finalize your completed report.";
      default:
        return `Instructions for Step ${stepNumber} will be added here`;
    }
  };

  return (
    <div className="bg-accent/30 p-4 rounded-md mb-6">
      <p className="text-muted-foreground text-center">{getStepInstructions(stepNumber)}</p>
    </div>
  );
};

export default InstructionsPanel;
