/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA_MEASUREMENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Google Analytics gtag 타입 선언
interface GtagEventParams {
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: unknown;
}

declare function gtag(
  command: 'config',
  targetId: string,
  config?: Record<string, unknown>
): void;
declare function gtag(
  command: 'event',
  eventName: string,
  eventParams?: GtagEventParams
): void;
declare function gtag(command: 'js', date: Date): void;
declare function gtag(command: 'set', config: Record<string, unknown>): void;

interface Window {
  gtag: typeof gtag;
  dataLayer: unknown[];
}
