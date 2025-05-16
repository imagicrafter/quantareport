
import { Template } from "@/types/template.types";

interface TemplateSummaryCardsProps {
  domainTemplates: Template[];
  myTemplates: Template[];
}

const TemplateSummaryCards = ({ domainTemplates, myTemplates }: TemplateSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-card p-6 rounded-lg border shadow">
        <h2 className="text-xl font-semibold mb-2">Domain Templates</h2>
        <p className="text-4xl font-bold">{domainTemplates.length}</p>
        <p className="text-muted-foreground">
          Templates available for your domain
        </p>
      </div>
      <div className="bg-card p-6 rounded-lg border shadow">
        <h2 className="text-xl font-semibold mb-2">My Templates</h2>
        <p className="text-4xl font-bold">{myTemplates.length}</p>
        <p className="text-muted-foreground">Your personal templates</p>
      </div>
    </div>
  );
};

export default TemplateSummaryCards;
