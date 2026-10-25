// Builds a CycloneDX 1.5 SBOM straight from package-lock.json (the ground truth for what `npm ci` installs).
// `npm sbom` was inconsistent on this tree (6 / 771 components vs 920 in the lockfile), so we read the lockfile ourselves.
// Regenerate with:  node threat_model/make-sbom.mjs
import fs from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';

const root = new URL('../', import.meta.url);
const lock = JSON.parse(fs.readFileSync(new URL('package-lock.json', root), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(new URL('package.json', root), 'utf8'));

const purl = (name, version) => `pkg:npm/${name.startsWith('@') ? '%40' + name.slice(1) : name}@${version}`;
const hashOf = (integrity) => {
  const m = /^(sha\d+)-(.+)$/.exec(integrity || '');
  if (!m) return [];
  const alg = { sha1: 'SHA-1', sha256: 'SHA-256', sha384: 'SHA-384', sha512: 'SHA-512' }[m[1]];
  return alg ? [{ alg, content: Buffer.from(m[2], 'base64').toString('hex') }] : [];
};

const components = [];
for (const [key, p] of Object.entries(lock.packages)) {
  if (!key.startsWith('node_modules/')) continue;
  const name = key.split('node_modules/').pop();
  const direct = key === `node_modules/${name}` && (name in (pkg.dependencies || {}) || name in (pkg.devDependencies || {}));
  const c = {
    type: 'library',
    'bom-ref': purl(name, p.version) + (key.split('node_modules/').length > 2 ? `#${key}` : ''),
    name,
    version: p.version,
    purl: purl(name, p.version),
    // required = shipped/needed at run time; optional = build-time tooling only (dev) or optional dependency
    scope: p.dev || p.optional ? 'optional' : 'required',
    properties: [
      { name: 'npm:dev', value: String(!!p.dev) },
      { name: 'npm:direct', value: String(direct) },
      ...(p.optional ? [{ name: 'npm:optional', value: 'true' }] : []),
    ],
  };
  const hashes = hashOf(p.integrity);
  if (hashes.length) c.hashes = hashes;
  if (p.license) c.licenses = [{ license: { name: typeof p.license === 'string' ? p.license : JSON.stringify(p.license) } }];
  if (p.resolved) c.externalReferences = [{ type: 'distribution', url: p.resolved }];
  components.push(c);
}
components.sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));

const bom = {
  bomFormat: 'CycloneDX',
  specVersion: '1.5',
  serialNumber: `urn:uuid:${randomUUID()}`,
  version: 1,
  metadata: {
    timestamp: new Date().toISOString(),
    tools: { components: [{ type: 'application', name: 'threat_model/make-sbom.mjs', version: '1.0.0' }] },
    component: { type: 'application', name: pkg.name, version: pkg.version, 'bom-ref': `${pkg.name}@${pkg.version}` },
    properties: [
      { name: 'source', value: 'package-lock.json' },
      { name: 'lockfileVersion', value: String(lock.lockfileVersion) },
      { name: 'lockfileSha256', value: createHash('sha256').update(fs.readFileSync(new URL('package-lock.json', root))).digest('hex') },
    ],
  },
  components,
};
fs.writeFileSync(new URL('threat_model/sbom.cdx.json', root), JSON.stringify(bom, null, 2) + '\n');

const runtime = components.filter((c) => c.scope === 'required');
console.log(`components: ${components.length}  (runtime/required: ${runtime.length}, build-time/optional: ${components.length - runtime.length})`);
console.log('runtime:', runtime.map((c) => `${c.name}@${c.version}`).join(', '));
const lic = {};
for (const c of components) { const l = c.licenses?.[0]?.license.name ?? '(none declared in lockfile)'; lic[l] = (lic[l] || 0) + 1; }
console.log('licences (top):', Object.entries(lic).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} x${v}`).join(', '));
