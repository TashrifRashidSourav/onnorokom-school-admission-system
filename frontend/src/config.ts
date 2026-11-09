interface AppConfig {
  apiUrl: string
}

declare global {
  interface Window {
    __APP_CONFIG__?: Partial<AppConfig>
  }
}

const DEFAULT_API_URL = 'http://localhost:8080'

function resolveApiUrl(): string {
  // 1. Runtime config written by the container entrypoint (public/config.js).
  // 2. Build-time VITE_API_URL, handy for `npm run dev` against another backend.
  // 3. The local default.
  const url =
    window.__APP_CONFIG__?.apiUrl || import.meta.env.VITE_API_URL || DEFAULT_API_URL
  return url.replace(/\/+$/, '')
}

export const config: AppConfig = {
  apiUrl: resolveApiUrl(),
}
