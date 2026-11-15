import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const productionRef = 'ldfnuxriakuxrbduekux';

// This check never connects to a service or prints configuration values.
export function validateReleaseTestEnvironment(config) {
  const errors = [];
  const ref = config?.TEST_SUPABASE_PROJECT_REF;
  if (typeof ref !== 'string' || !/^[a-z]{20}$/.test(ref) || ref === productionRef) {
    errors.push('TEST_SUPABASE_PROJECT_REF must identify a separate test project.');
  }
  for (const key of ['NEXT_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_URL']) {
    try {
      const url = new URL(config[key]);
      if (url.origin !== `https://${ref}.supabase.co` || url.pathname !== '/' ||
          url.username || url.password || url.search || url.hash) throw new Error();
    } catch {
      errors.push(`${key} must match the test project HTTPS origin.`);
    }
  }
  for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
    try {
      const url = new URL(config[key]);
      const direct = url.hostname === `db.${ref}.supabase.co` && url.username === 'postgres';
      const pooler = /^[a-z0-9-]+\.pooler\.supabase\.com$/.test(url.hostname) &&
        url.username === `postgres.${ref}`;
      if (!['postgres:', 'postgresql:'].includes(url.protocol) || (!direct && !pooler) ||
          !url.password || url.pathname !== '/postgres' || url.hash ||
          url.searchParams.getAll('sslmode').length !== 1 || url.searchParams.get('sslmode') !== 'require') {
        throw new Error();
      }
      // Query parameters must not override the host, user, or database checked above.
      for (const name of url.searchParams.keys()) {
        if (!['sslmode', 'pgbouncer', 'connection_limit', 'pool_timeout'].includes(name)) throw new Error();
      }
    } catch {
      errors.push(`${key} must use the same test project and require SSL.`);
    }
  }
  try {
    const url = new URL(config.EXPO_PUBLIC_API_URL);
    if (url.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
        !url.port || url.username || url.password || url.search || url.hash) throw new Error();
  } catch {
    errors.push('EXPO_PUBLIC_API_URL must point to an explicit local test port.');
  }
  return [...new Set(errors)];
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const file = process.argv[2];
    if (!file) throw new Error();
    const errors = validateReleaseTestEnvironment(JSON.parse(readFileSync(file, 'utf8')));
    if (errors.length) {
      errors.forEach((error) => console.error(error));
      process.exitCode = 1;
    } else {
      console.log('PASS: supplied URLs identify an isolated test target. No connection or mutation performed.');
    }
  } catch {
    console.error('Provide a readable JSON configuration file. Configuration contents are not logged.');
    process.exitCode = 1;
  }
}
