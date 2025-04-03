
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_N8N_DEV_WEBHOOK: string;
  readonly VITE_N8N_PROD_WEBHOOK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
