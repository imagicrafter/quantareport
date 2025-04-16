
-- Function to get the active workflow for a user in a specific state
CREATE OR REPLACE FUNCTION get_active_workflow(p_user_id UUID, p_workflow_state INTEGER)
RETURNS TABLE (
  id UUID,
  project_id UUID,
  workflow_state SMALLINT,
  user_id UUID,
  created_at TIMESTAMPTZ,
  last_update TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pw.id,
    pw.project_id,
    pw.workflow_state,
    pw.user_id,
    pw.created_at,
    plu.last_update
  FROM 
    project_workflow pw
  JOIN 
    v_projects_last_update plu ON pw.project_id = plu.project_id
  WHERE 
    pw.user_id = p_user_id 
    AND pw.workflow_state = p_workflow_state
  ORDER BY 
    plu.last_update DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to update workflow state
CREATE OR REPLACE FUNCTION update_workflow_state(p_project_id UUID, p_workflow_state INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  workflow_exists BOOLEAN;
BEGIN
  -- Check if workflow entry exists
  SELECT EXISTS (
    SELECT 1 FROM project_workflow WHERE project_id = p_project_id
  ) INTO workflow_exists;
  
  IF workflow_exists THEN
    -- Update existing workflow state
    UPDATE project_workflow 
    SET workflow_state = p_workflow_state
    WHERE project_id = p_project_id;
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to insert new workflow state
CREATE OR REPLACE FUNCTION insert_workflow_state(
  project_id_param UUID, 
  user_id_param UUID, 
  workflow_state_param INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO project_workflow (project_id, user_id, workflow_state)
  VALUES (project_id_param, user_id_param, workflow_state_param);
  
  RETURN TRUE;
EXCEPTION
  WHEN others THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to set workflow state (create or update)
CREATE OR REPLACE FUNCTION set_workflow_state(p_project_id UUID, p_workflow_state INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  workflow_exists BOOLEAN;
  user_id_val UUID;
BEGIN
  -- Check if workflow entry exists
  SELECT EXISTS (
    SELECT 1 FROM project_workflow WHERE project_id = p_project_id
  ) INTO workflow_exists;
  
  IF workflow_exists THEN
    -- Update existing workflow state
    UPDATE project_workflow 
    SET workflow_state = p_workflow_state
    WHERE project_id = p_project_id;
    
    RETURN TRUE;
  ELSE
    -- Get the user ID from the project
    SELECT user_id INTO user_id_val
    FROM projects
    WHERE id = p_project_id;
    
    IF user_id_val IS NOT NULL THEN
      -- Insert new workflow entry
      INSERT INTO project_workflow (project_id, user_id, workflow_state)
      VALUES (p_project_id, user_id_val, p_workflow_state);
      
      RETURN TRUE;
    ELSE
      RETURN FALSE;
    END IF;
  END IF;
EXCEPTION
  WHEN others THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get projects in a specific workflow state
CREATE OR REPLACE FUNCTION get_projects_in_state(state_param INTEGER)
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT project_id
  FROM project_workflow
  WHERE workflow_state = state_param;
END;
$$ LANGUAGE plpgsql;
