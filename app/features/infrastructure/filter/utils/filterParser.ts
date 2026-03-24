import type {
  Filter,
  FilterRequest,
  FilterSection,
  FilterSectionRequest,
} from '../types';

import { cloneDeep } from 'es-toolkit';
import { fromUint8Array, toUint8Array } from 'js-base64';
import pako from 'pako';

/**
 * Извлекает выбранные элементы из секции фильтра
 */
export function getSelectedFilters(
  section: FilterSection | undefined,
): FilterSectionRequest | undefined {
  if (!section?.groups) {
    return undefined;
  }

  const groups = section.groups
    .map(({ name, filters, ...groupFields }) => {
      const selectedFilters = filters.filter((item) => item.selected != null);

      if (selectedFilters.length === 0) {
        return null;
      }

      return {
        ...groupFields,
        filters: selectedFilters.map(({ name: _name, ...fields }) => fields),
      };
    })
    .filter((group) => !!group);

  return groups.length > 0 ? { groups } : undefined;
}

/**
 * Собирает объект запроса из обеих секций фильтра (filter + sources)
 */
export function getFilterRequest(
  filter: Filter | undefined,
): FilterRequest | undefined {
  const filterSection = getSelectedFilters(filter?.filter);
  const sourcesSection = getSelectedFilters(filter?.sources);

  if (!filterSection && !sourcesSection) {
    return undefined;
  }

  const result: FilterRequest = {};

  if (filterSection) {
    result.filter = filterSection;
  }

  if (sourcesSection) {
    result.sources = sourcesSection;
  }

  return result;
}

/**
 * Сжимает объект запроса в строку для URL
 */
export function compressFilters(filter: FilterRequest | undefined): string {
  if (!filter) {
    return '';
  }

  try {
    const jsonString = JSON.stringify(filter);
    const compressed = pako.deflate(jsonString, { level: 9 });

    return fromUint8Array(compressed, true);
  } catch (error) {
    consola.error('Error compressing filters:', error);

    return '';
  }
}

/**
 * Распаковывает строку из URL в объект запроса
 */
export function decompressFilters(
  compressedString: string,
): FilterRequest | undefined {
  if (!compressedString) {
    return undefined;
  }

  try {
    const bytes = toUint8Array(compressedString);
    const decompressed = pako.inflate(bytes, { to: 'string' });

    return JSON.parse(decompressed);
  } catch (error) {
    consola.error('Error decompressing filters:', error);

    return undefined;
  }
}

/**
 * Применяет сжатые фильтры к секции
 */
export function applyCompressedSection(
  originalSection: FilterSection,
  compressedSection: FilterSectionRequest | undefined,
): FilterSection {
  if (!compressedSection?.groups) {
    return originalSection;
  }

  const result = cloneDeep(originalSection);

  compressedSection.groups.forEach((compressedGroup) => {
    const originalGroup = result.groups.find(
      (g) => g.key === compressedGroup.key,
    );

    if (originalGroup) {
      compressedGroup.filters.forEach((compressedItem) => {
        const originalItem = originalGroup.filters.find(
          (f) =>
            f.key === compressedItem.key && f.value === compressedItem.value,
        );

        if (originalItem) {
          originalItem.selected = compressedItem.selected;
        }
      });
    }
  });

  return result;
}

/**
 * Применяет сжатый объект запроса ко всему фильтру (filter + sources)
 */
export function applyCompressedFilters(
  originalFilter: Filter,
  compressed: FilterRequest | undefined,
): Filter {
  if (!compressed) {
    return originalFilter;
  }

  return {
    filter: applyCompressedSection(originalFilter.filter, compressed.filter),
    sources: applyCompressedSection(originalFilter.sources, compressed.sources),
  };
}
