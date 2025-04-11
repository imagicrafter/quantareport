
export interface ProjectWorkflow {
  id: string;
  project_id: string;
  user_id: string;
  workflow_state: number;
  created_at: string;
  last_edited_at: string;
}

export type WorkflowState = 1 | 2 | 3 | 4 | 5 | 6; // Steps 1-6 in the workflow
