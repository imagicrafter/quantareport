
export interface Template {
  id: string;
  name: string;
  description: string | null;
  image_module: any | null;
  report_module: any | null;
  is_public: boolean | null;
  domain_id: string | null;
  user_id: string | null;
  created_at: string | null;
}

export interface Profile {
  id: string;
  email: string;
  role: string;
  domain_id: string | null;
}
