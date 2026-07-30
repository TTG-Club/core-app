import type { VttgDesktopRelease } from '#shared/types';

import type { VttgDownloadPlatform } from './types';

/** Единицы размера файла: индекс совпадает со степенью 1024. */
const FILE_SIZE_UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const;

/**
 * Человекочитаемый размер файла на русском — например `1,1 ГБ`.
 * Единицы даёт Intl, поэтому подписи локализованные, а не английские `GB`.
 *
 * @param size размер в байтах.
 * @returns размер с единицей измерения или пустая строка, если размер неизвестен.
 */
export function formatFileSize(size: number): string {
  if (!Number.isFinite(size) || size <= 0) {
    return '';
  }

  const power = Math.max(
    0,
    Math.min(
      Math.floor(Math.log(size) / Math.log(1024)),
      FILE_SIZE_UNITS.length - 1,
    ),
  );

  const unit = FILE_SIZE_UNITS[power] ?? 'byte';

  return new Intl.NumberFormat('ru', {
    style: 'unit',
    unit,
    unitDisplay: 'short',
    // Десятые нужны только крупным единицам: «1,1 ГБ» полезно, «512,3 Б» — шум.
    maximumFractionDigits: power > 1 ? 1 : 0,
  }).format(size / 1024 ** power);
}

/**
 * Подпись сборки для интерфейса — `Версия 0.9.273 · 219,3 МБ`. Вес показываем
 * только если он есть в манифесте: перед скачиванием установщика это важнее,
 * чем дата релиза.
 *
 * @param release последняя сборка десктопного VTTG.
 */
export function formatReleaseSummary(release: VttgDesktopRelease): string {
  const version = `Версия ${release.version}`;
  const size = release.size ? formatFileSize(release.size) : '';

  return size ? `${version} · ${size}` : version;
}

/**
 * Подпись кнопки платформы: у готовой сборки зовёт скачать, у остальных — сама
 * говорит, что платформа впереди.
 *
 * @param platform платформа из `VTTG_DOWNLOAD_PLATFORMS`.
 */
export function formatPlatformLabel(platform: VttgDownloadPlatform): string {
  return platform.ready
    ? `Скачать для ${platform.name}`
    : `${platform.name} — скоро`;
}
