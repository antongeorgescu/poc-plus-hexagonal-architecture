/**
 * OPTIONAL runtime override for the model runtime behind LanguageModelPort.
 * Copy to `ai-config.js`, edit, and add this line to src/index.html <head>:
 *     <script src="assets/ai-config.js"></script>
 *
 * Nothing here is required: with no override the app runs mode 'mock'.
 * You can also flip modes per-load with a query string: ?ai=proxy / ?ai=mock
 *
 * Do NOT put a real key in this file for anything shared — it ships to the
 * browser. Use mode 'proxy' (see proxy.conf.js) and leave apiKey empty.
 */
window.__AI_CONFIG__ = {
  mode: 'proxy',              // 'mock' | 'proxy' | 'directKey'
  deployment: 'gpt-4o-mini',  // YOUR Azure OpenAI deployment name
  apiVersion: '2024-10-21',
  timeoutMs: 8000,
};
