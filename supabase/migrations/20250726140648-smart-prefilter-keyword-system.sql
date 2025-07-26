-- Smart Pre-filtering System: Keyword Dictionary and Metadata Tables
-- This migration creates the foundation for intelligent image-to-notes matching
-- by implementing keyword extraction and categorization for inspection items

-- Create keyword categories table
CREATE TABLE public.keyword_categories (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL UNIQUE,
  weight DECIMAL(3,2) DEFAULT 1.0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create keywords lookup table for inspection terms
CREATE TABLE public.inspection_keywords (
  id SERIAL PRIMARY KEY,
  keyword VARCHAR(100) NOT NULL,
  category_id INTEGER REFERENCES public.keyword_categories(id) ON DELETE CASCADE,
  aliases TEXT[], -- Array of similar terms for flexible matching
  regex_pattern TEXT, -- For pattern-based matching
  weight DECIMAL(3,2) DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on keyword tables
ALTER TABLE public.keyword_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_keywords ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for keyword management
-- Admins can manage all keywords
CREATE POLICY "Admins can manage keyword categories"
ON public.keyword_categories
FOR ALL
TO authenticated
USING (check_user_role('admin'));

CREATE POLICY "Admins can manage inspection keywords"
ON public.inspection_keywords
FOR ALL
TO authenticated
USING (check_user_role('admin'));

-- All authenticated users can read keywords (needed for matching)
CREATE POLICY "Users can read keyword categories"
ON public.keyword_categories
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can read inspection keywords"
ON public.inspection_keywords
FOR SELECT
TO authenticated
USING (is_active = true);

-- Insert initial keyword categories for home inspection
INSERT INTO public.keyword_categories (category, weight, description) VALUES
  ('foundation', 1.0, 'Foundation, basement, crawl space, and structural support elements'),
  ('electrical', 1.0, 'Electrical systems, wiring, panels, outlets, and fixtures'),
  ('plumbing', 1.0, 'Plumbing systems, pipes, fixtures, water heaters, and drainage'),
  ('hvac', 1.0, 'Heating, ventilation, air conditioning, and ductwork systems'),
  ('roofing', 1.0, 'Roof structure, shingles, gutters, flashing, and attic components'),
  ('interior', 0.8, 'Interior rooms, finishes, doors, windows, and fixtures'),
  ('exterior', 0.8, 'Exterior walls, siding, trim, decks, and outdoor features'),
  ('structural', 1.0, 'Load-bearing elements, framing, and structural integrity'),
  ('safety', 1.0, 'Safety systems, smoke detectors, carbon monoxide, and hazards'),
  ('insulation', 0.9, 'Insulation systems and energy efficiency components');

-- Insert initial inspection keywords with aliases
INSERT INTO public.inspection_keywords (keyword, category_id, aliases, weight) VALUES
  -- Foundation keywords
  ('foundation', 1, ARRAY['basement', 'crawl space', 'slab', 'footings', 'concrete pad'], 1.0),
  ('crack', 1, ARRAY['cracking', 'fissure', 'split', 'fracture'], 0.9),
  ('moisture', 1, ARRAY['water', 'dampness', 'wet', 'humidity', 'leak'], 0.8),
  
  -- Electrical keywords  
  ('electrical', 2, ARRAY['wiring', 'wire', 'electric', 'power'], 1.0),
  ('panel', 2, ARRAY['breaker', 'electrical panel', 'main panel', 'sub panel'], 1.0),
  ('outlet', 2, ARRAY['receptacle', 'plug', 'socket', 'gfci'], 0.9),
  ('lighting', 2, ARRAY['light', 'fixture', 'lamp', 'switch'], 0.8),
  
  -- Plumbing keywords
  ('plumbing', 3, ARRAY['pipes', 'piping', 'water system'], 1.0),
  ('faucet', 3, ARRAY['tap', 'spigot', 'valve'], 0.9),
  ('toilet', 3, ARRAY['commode', 'bathroom', 'water closet'], 0.9),
  ('drain', 3, ARRAY['drainage', 'sewer', 'waste'], 0.8),
  ('water heater', 3, ARRAY['hot water', 'heater', 'tank'], 1.0),
  
  -- HVAC keywords
  ('hvac', 4, ARRAY['heating', 'cooling', 'climate', 'air'], 1.0),
  ('furnace', 4, ARRAY['heater', 'boiler', 'heat pump'], 1.0),
  ('ductwork', 4, ARRAY['ducts', 'vents', 'ventilation'], 0.9),
  ('filter', 4, ARRAY['air filter', 'hvac filter'], 0.8),
  
  -- Roofing keywords
  ('roof', 5, ARRAY['roofing', 'shingles', 'tiles'], 1.0),
  ('gutters', 5, ARRAY['gutter', 'downspout', 'drainage'], 0.9),
  ('flashing', 5, ARRAY['roof flashing', 'metal flashing'], 0.8),
  ('attic', 5, ARRAY['loft', 'roof space'], 0.9),
  
  -- Interior keywords
  ('kitchen', 6, ARRAY['appliances', 'cabinets', 'countertop', 'sink'], 0.8),
  ('bathroom', 6, ARRAY['shower', 'bathtub', 'vanity', 'bath'], 0.8),
  ('bedroom', 6, ARRAY['room', 'sleeping'], 0.7),
  ('flooring', 6, ARRAY['floor', 'carpet', 'hardwood', 'tile'], 0.8),
  
  -- Exterior keywords
  ('siding', 7, ARRAY['exterior wall', 'cladding', 'brick', 'vinyl'], 0.8),
  ('windows', 7, ARRAY['window', 'glass', 'pane'], 0.8),
  ('doors', 7, ARRAY['door', 'entry', 'entrance'], 0.7),
  ('deck', 7, ARRAY['porch', 'patio', 'balcony'], 0.8),
  
  -- Safety keywords
  ('smoke detector', 9, ARRAY['smoke alarm', 'fire alarm'], 1.0),
  ('carbon monoxide', 9, ARRAY['co detector', 'co alarm'], 1.0),
  ('hazard', 9, ARRAY['danger', 'risk', 'unsafe'], 0.9);

-- Add pre-filtering columns to existing tables
-- Add columns to files table for image metadata
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS extracted_keywords TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS location_hints TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS component_category VARCHAR(50);
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS prefilter_score DECIMAL(4,2) DEFAULT 0.0;
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS keywords_extracted_at TIMESTAMP WITH TIME ZONE;

-- Add columns to notes table for note analysis
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS extracted_keywords TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS primary_category VARCHAR(50);
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS location_context TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS keywords_extracted_at TIMESTAMP WITH TIME ZONE;

-- Create table for tracking prefilter performance metrics
CREATE TABLE public.prefilter_metrics (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  total_combinations INTEGER NOT NULL,
  filtered_combinations INTEGER NOT NULL,
  filter_ratio DECIMAL(5,4) NOT NULL,
  execution_time DECIMAL(8,3), -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on metrics table
ALTER TABLE public.prefilter_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for metrics
CREATE POLICY "Users can view their project metrics"
ON public.prefilter_metrics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = prefilter_metrics.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Admins can view all metrics
CREATE POLICY "Admins can view all prefilter metrics"
ON public.prefilter_metrics
FOR ALL
TO authenticated
USING (check_user_role('admin'));

-- Create indexes for performance
CREATE INDEX idx_inspection_keywords_category ON public.inspection_keywords(category_id);
CREATE INDEX idx_inspection_keywords_active ON public.inspection_keywords(is_active);
CREATE INDEX idx_files_keywords ON public.files USING GIN(extracted_keywords);
CREATE INDEX idx_notes_keywords ON public.notes USING GIN(extracted_keywords);
CREATE INDEX idx_files_prefilter_score ON public.files(prefilter_score);
CREATE INDEX idx_prefilter_metrics_project ON public.prefilter_metrics(project_id);

-- Create trigger functions for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_keyword_categories_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_inspection_keywords_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER update_keyword_categories_updated_at
  BEFORE UPDATE ON public.keyword_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_keyword_categories_updated_at();

CREATE TRIGGER update_inspection_keywords_updated_at
  BEFORE UPDATE ON public.inspection_keywords
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inspection_keywords_updated_at();

-- Create helper function for keyword extraction (to be used in n8n and edge functions)
CREATE OR REPLACE FUNCTION public.extract_keywords_from_text(
  input_text TEXT,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  keyword VARCHAR(100),
  category VARCHAR(50),
  match_score DECIMAL(4,2),
  match_type TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ik.keyword,
    kc.category,
    CASE 
      WHEN lower(input_text) = lower(ik.keyword) THEN ik.weight * 2.0
      WHEN position(lower(ik.keyword) IN lower(input_text)) > 0 THEN ik.weight * 1.5
      WHEN ik.aliases && string_to_array(lower(input_text), ' ') THEN ik.weight * 1.2
      ELSE 0.0
    END AS match_score,
    CASE 
      WHEN lower(input_text) = lower(ik.keyword) THEN 'exact'
      WHEN position(lower(ik.keyword) IN lower(input_text)) > 0 THEN 'partial'
      WHEN ik.aliases && string_to_array(lower(input_text), ' ') THEN 'alias'
      ELSE 'none'
    END AS match_type
  FROM public.inspection_keywords ik
  JOIN public.keyword_categories kc ON ik.category_id = kc.id
  WHERE 
    ik.is_active = true
    AND (category_filter IS NULL OR kc.category = category_filter)
    AND (
      position(lower(ik.keyword) IN lower(input_text)) > 0
      OR ik.aliases && string_to_array(lower(input_text), ' ')
    )
  ORDER BY match_score DESC;
END;
$$;