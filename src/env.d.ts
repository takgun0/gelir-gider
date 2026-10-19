/** package.json sürümü; vite.config.ts'teki define ile gelir. */
declare const __APP_VERSION__: string;

interface Navigator {
  /** iOS Safari: ana ekrandan açıldıysa true */
  standalone?: boolean;
}
