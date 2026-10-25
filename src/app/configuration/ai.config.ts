/**
 * CONFIGURATION — which model runtime sits behind LanguageModelPort, and how to
 * reach it. This file is composition-root material: nothing in `core/` or
 * `ports/` may import it, because *which* model answers is a deployment choice,
 * not a business rule.
 *
 * SECRETS: there is deliberately no API key in this file and no default that
 * embeds one. An Angular app is a browser bundle — anything compiled into it is
 * readable by anyone who opens devtools. The supported path is `mode: 'proxy'`
 * (the default when Azure is enabled), where the dev server holds the key and
 * the browser only ever calls a same-origin relative URL. `directKey` exists for
 * throwaway local spikes and warns loudly; do not ship it.
 */

import { AzureAiOptions } from '../adapters/driven/azure-ai-language-model';

/** Where the model runtime lives. */
export type AiMode =
  /** The server-side keyword model (no LLM, no Azure, no credentials). The POC default. */
  | 'mock'
  /** Azure OpenAI via a same-origin proxy that injects the key server-side. */
  | 'proxy'
  /** Azure OpenAI called straight from the browser. Key IS exposed. Spikes only. */
  | 'directKey';

/**
 * The adapter's own options plus the deployment-level `mode`. `sendKeyHeader` is
 * derived from the mode in {@link toAzureOptions} rather than being set by hand,
 * so 'proxy' can never accidentally ship a key.
 *
 *  - baseUrl in proxy mode:     a relative path handled by proxy.conf.js
 *  - baseUrl in directKey mode: https://<resource>.openai.azure.com
 */
export interface AiConfig extends Omit<AzureAiOptions, 'sendKeyHeader'> {
  mode: AiMode;
}

const DEFAULTS: AiConfig = {
  mode: 'mock',
  baseUrl: '/api/azure-ai',
  deployment: 'gpt-4o-mini',
  apiVersion: '2024-10-21',
  apiKey: '',
  timeoutMs: 8000,
  temperature: 0.3,
  maxTokens: 400,
};

declare global {
  interface Window {
    /** Optional runtime override; see src/assets/ai-config.example.js. */
    __AI_CONFIG__?: Partial<AiConfig>;
  }
}

/**
 * The query string as it was when the app booted.
 *
 * WHY CAPTURED EAGERLY: `resolveAiConfig()` runs inside an Angular `useFactory`,
 * which Angular evaluates LAZILY — the first time `LANGUAGE_MODEL_PORT` is
 * injected, which is on the dashboard. By then the router has navigated
 * `/?ai=proxy` → `/login?ai=proxy` → `/dashboard` and **dropped the query
 * string**, so reading `location.search` at that point always saw `''` and the
 * `?ai=` override silently never applied. This module is imported by the
 * composition root, so it loads during bootstrap while the parameter is intact.
 */
const BOOT_SEARCH = typeof window !== 'undefined' ? window.location.search : '';

/** Resolved once: every consumer must see the same runtime for the session. */
let cached: AiConfig | null = null;

/**
 * Resolve the effective config: defaults, then any `window.__AI_CONFIG__`, then
 * a `?ai=` query override so the two runtimes can be demonstrated side by side
 * without a rebuild (`?ai=mock` / `?ai=proxy`).
 */
export function resolveAiConfig(): AiConfig {
  if (cached) return cached;

  const runtime = (typeof window !== 'undefined' && window.__AI_CONFIG__) || {};
  const cfg: AiConfig = { ...DEFAULTS, ...runtime };

  {
    const q = new URLSearchParams(BOOT_SEARCH).get('ai');
    if (q === 'mock' || q === 'proxy' || q === 'directKey') cfg.mode = q;
  }

  if (cfg.mode === 'directKey' && cfg.apiKey) {
    console.warn(
      '[ai.config] mode="directKey": the Azure API key is exposed to the browser. ' +
        'Use mode="proxy" for anything beyond a local spike.'
    );
  }
  if (cfg.mode === 'directKey' && !cfg.apiKey) {
    console.warn('[ai.config] mode="directKey" but no apiKey supplied — calls will fail and fall back to the server keyword model.');
  }

  cached = cfg;
  return cfg;
}

/** True when the config asks for a real Azure call. */
export function usesAzure(cfg: AiConfig): boolean {
  return cfg.mode === 'proxy' || cfg.mode === 'directKey';
}

/** Narrow the deployment-level config to what the adapter actually needs. */
export function toAzureOptions(cfg: AiConfig): AzureAiOptions {
  const { mode, ...rest } = cfg;
  return {
    ...rest,
    // Only ONE mode ever puts a credential in the browser, and it is opt-in.
    sendKeyHeader: mode === 'directKey',
    apiKey: mode === 'directKey' ? cfg.apiKey : '',
  };
}
