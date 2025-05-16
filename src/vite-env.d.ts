
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_N8N_DEV_WEBHOOK: string;
  readonly VITE_N8N_STAGING_WEBHOOK: string;
  readonly VITE_N8N_PROD_WEBHOOK: string;
  readonly VITE_N8N_NOTE_DEV_WEBHOOK: string;
  readonly VITE_N8N_NOTE_STAGING_WEBHOOK: string;
  readonly VITE_N8N_NOTE_PROD_WEBHOOK: string;
  readonly VITE_FILE_ANALYSIS_DEV_WEBHOOK: string;
  readonly VITE_FILE_ANALYSIS_STAGING_WEBHOOK: string;
  readonly VITE_FILE_ANALYSIS_PROD_WEBHOOK: string;
  readonly VITE_APP_ENVIRONMENT: string;
  // New test webhooks
  readonly VITE_DEV_NOTE_TEST_WEBHOOK_URL: string;
  readonly VITE_DEV_FILE_ANALYSIS_TEST_WEBHOOK_URL: string;
  readonly VITE_DEV_REPORT_TEST_WEBHOOK_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
