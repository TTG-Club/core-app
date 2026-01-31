import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { consola } from 'consola';

// В ESM __dirname нужно получать явно
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = resolve(__dirname, '..');
const source = join(rootDir, '.cursorrules');
const targets = ['AGENTS.md', 'CLAUDE.md'];

consola.log('🔄 Синхронизация правил ИИ...');

try {
  if (!existsSync(source)) {
    consola.warn('⚠️  .cursorrules не найден. Нечего раздавать.');
    process.exit(0);
  }

  for (const file of targets) {
    const targetPath = join(rootDir, file);

    copyFileSync(source, targetPath);
    consola.log(`✨  Обновлен: ${file}`);
  }
} catch (error) {
  consola.error('🔥 Ошибка синхронизации:', error);
  process.exit(1);
}
