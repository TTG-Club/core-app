import type { VttgBuild, VttgBuildFile } from '#shared/types';

/** Подписи форматов файлов — как их называют сами платформы. */
const BUILD_FORMAT_LABELS: Record<string, string> = {
  'exe': 'Установщик',
  'dmg': 'Образ DMG',
  'appimage': 'AppImage',
  'deb': 'Пакет DEB',
  'tar.gz': 'Архив',
};

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
 * Подпись сборки для интерфейса — `Версия 0.9.273 · 219,3 МБ`. Версия у каждой
 * платформы своя, поэтому подпись собирается по конкретной сборке. Вес
 * показываем только если он есть в манифесте: перед скачиванием это важнее,
 * чем дата релиза; когда файлов несколько — вес уходит на кнопки.
 *
 * @param build сборка из канала обновлений.
 * @returns подпись или `null`, если сборки в канале ещё нет.
 */
export function formatBuildSummary(
  build: VttgBuild | undefined,
): string | null {
  if (!build?.version) {
    return null;
  }

  const version = `Версия ${build.version}`;
  const single = build.files.length === 1 ? build.files[0] : undefined;
  const size = single?.size ? formatFileSize(single.size) : '';

  return size ? `${version} · ${size}` : version;
}

/**
 * Подпись кнопки файла. Когда файл у сборки один, кнопка просто зовёт скачать;
 * когда их несколько (у Linux — AppImage и deb), кнопка называет формат, иначе
 * их не различить.
 *
 * @param file файл сборки.
 * @param isSingle единственный ли он у сборки.
 */
export function formatBuildFileLabel(
  file: VttgBuildFile,
  isSingle: boolean,
): string {
  if (isSingle) {
    return 'Скачать';
  }

  return BUILD_FORMAT_LABELS[file.format.toLowerCase()] ?? file.format;
}
