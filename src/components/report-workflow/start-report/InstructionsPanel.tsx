
interface InstructionsPanelProps {
  stepNumber: number;
}

const InstructionsPanel = ({ stepNumber }: InstructionsPanelProps) => {
  return (
    <div className="bg-accent/30 p-4 rounded-md mb-6">
      <p className="text-muted-foreground text-center">[Instructions for Step {stepNumber} will be added here]</p>
    </div>
  );
};

export default InstructionsPanel;
