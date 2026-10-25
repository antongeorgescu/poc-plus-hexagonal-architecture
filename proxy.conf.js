/**
 * Dev-server proxy for the Azure OpenAI connection (ai.config mode: 'proxy').
 *
 * WHY THIS EXISTS: an Angular app is a browser bundle. Any key compiled into it
 * — or fetched into it — is readable by anyone who opens devtools. So the browser
 * never sees the credential: it calls the same-origin path /api/azure-ai, and
 * THIS process (the dev server, running on your machine) attaches the key and
 * forwards to Azure.
 *
 * Set these before `npm start`:
 *   PowerShell:  $env:AZURE_OPENAI_ENDPOINT = 'https://<resource>.openai.azure.com'
 *                $env:AZURE_OPENAI_API_KEY  = '<key>'
 *   bash:        export AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com
 *                export AZURE_OPENAI_API_KEY=<key>
 *
 * This covers local development only. `ng build` produces static files with no
 * proxy in front of them — a deployed build needs a real server-side endpoint
 * (an API route, an APIM policy, or a function) doing the same key injection.
 */
const endpoint = process.env['AZURE_OPENAI_ENDPOINT'] || '';
const apiKey = process.env['AZURE_OPENAI_API_KEY'] || '';

if (!endpoint || !apiKey) {
  console.warn(
    '\n[proxy.conf] AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY are not both set.\n' +
      '             Calls to /api/azure-ai will fail and the app will use its offline\n' +
      '             stub. This is fine — the POC runs without Azure. Set them to go live.\n'
  );
}

module.exports = {
  '/api/azure-ai': {
    target: endpoint || 'http://localhost:9',   // unroutable when unset -> fast failure -> fallback
    secure: true,
    changeOrigin: true,
    pathRewrite: { '^/api/azure-ai': '' },
    logLevel: 'warn',
    onProxyReq: (proxyReq) => {
      if (apiKey) proxyReq.setHeader('api-key', apiKey);
    },
    onError: (err, _req, res) => {
      // Answer rather than hang, so the adapter's fallback engages promptly.
      console.warn('[proxy.conf] upstream error:', err.message);
      if (res && !res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json' });
      if (res) res.end(JSON.stringify({ error: 'azure-openai proxy unavailable' }));
    },
  },

  // The local data API (server/api.mjs, `npm run api`) — login and payments. Listed
  // AFTER /api/azure-ai so that more specific path keeps matching first.
  '/api': {
    target: 'http://127.0.0.1:3000',
    secure: false,
    logLevel: 'warn',
    onError: (err, _req, res) => {
      console.warn('[proxy.conf] data API unreachable — is `npm run api` running?', err.message);
      if (res && !res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json' });
      if (res) res.end(JSON.stringify({ success: false, message: 'The data service is unavailable.' }));
    },
  },
};
