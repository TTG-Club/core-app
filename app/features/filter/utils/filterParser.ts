import { cloneDeep } from 'lodash-es';
import pako from 'pako';

import type { Filter, FilterRequest } from '../types';

export function getSelectedFilters(
  filter: Filter | undefined,
): FilterRequest | undefined {
  if (!filter?.groups) {
    return undefined;
  }

  const groups = filter.groups
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

  return groups.length > 0 ? { groups, version: filter.version } : undefined;
}

export function compressFilters(filter: FilterRequest | undefined): string {
  if (!filter) {
    return '';
  }

  try {
    const jsonString = JSON.stringify(filter);
    const compressed = pako.deflate(jsonString, { level: 9 });

    return btoa(String.fromCharCode(...compressed));
  } catch (error) {
    console.error('Error compressing filters:', error);

    return '';
  }
}

export function decompressFilters(
  compressedString: string,
): FilterRequest | undefined {
  if (!compressedString) {
    return undefined;
  }

  try {
    const binaryString = atob(compressedString);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const decompressed = pako.inflate(bytes, { to: 'string' });

    return JSON.parse(decompressed);
  } catch (error) {
    console.error('Error decompressing filters:', error);

    return undefined;
  }
}

export function applyCompressedFilters(
  originalFilter: Filter,
  compressedFilter: FilterRequest | undefined,
): Filter {
  if (!compressedFilter?.groups) {
    return originalFilter;
  }

  const result = cloneDeep(originalFilter);

  compressedFilter.groups.forEach((compressedGroup) => {
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
