import { readFileSync } from 'node:fs';
import path from 'node:path';
import { syncSupabaseMediaFromDisk } from '../src/lib/sync-supabase-media';

const root = path.join(__dirname, '..');

function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    try {
      const raw = readFileSync(path.join(root, name), 'utf8');
      for (const line of raw.split('\n')) {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m && !process.env[m[1].trim()]) {
          process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
        }
      }
    } catch {
      /* skip */
    }
  }
}

async function main() {
  loadEnv();
  process.chdir(root);
  const result = await syncSupabaseMediaFromDisk();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
