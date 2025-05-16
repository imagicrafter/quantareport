
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Template } from "@/types/template.types";

interface TemplateTableProps {
  templates: Template[];
  emptyMessage: string;
  onAction: (template: Template) => void;
  actionLabel: string;
}

const TemplateTable = ({ templates, emptyMessage, onAction, actionLabel }: TemplateTableProps) => {
  const getTemplateType = (template: Template) => {
    const types = [];
    if (template.image_module) types.push("Image");
    if (template.report_module) types.push("Report");
    if (template.layout_module) types.push("Layout");
    if (template.html_module) types.push("HTML");
    return types.length > 0 ? types.join(", ") : "—";
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="w-[100px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">
                  {template.name}
                </TableCell>
                <TableCell>{template.description || "—"}</TableCell>
                <TableCell>{getTemplateType(template)}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant={actionLabel === "Edit" ? "outline" : "default"}
                    onClick={() => onAction(template)}
                  >
                    {actionLabel}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TemplateTable;
