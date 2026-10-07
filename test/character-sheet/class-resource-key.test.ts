import type { CharacterClassResource } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  mergeClassResources,
  NEW_CLASS_RESOURCE,
  toSavedClassResource,
} from '~character-sheet/model';

/**
 * Собирает ресурс листа с нужными идентификатором и ключом; остальные поля на
 * ключ не влияют.
 *
 * @param id идентификатор ресурса.
 * @param key ключ ресурса.
 * @returns ресурс листа.
 */
function createResource(id: string, key?: string): CharacterClassResource {
  return { ...NEW_CLASS_RESOURCE, id, key };
}

describe('toSavedClassResource', () => {
  it('обрезает пробелы по краям ключа', () => {
    expect(toSavedClassResource(createResource('own', ' rage ')).key).toBe(
      'rage',
    );
  });

  it('не пишет пустой ключ', () => {
    expect(toSavedClassResource(createResource('own', '  ')).key).toBe(
      undefined,
    );
  });
});

describe('mergeClassResources', () => {
  it('отдаёт ресурсу листа книжный ключ из справочника', () => {
    const [mergedResource] = mergeClassResources(
      [createResource('feat:res:rage')],
      [createResource('feat:res:rage', 'rage')],
    );

    expect(mergedResource?.key).toBe('rage');
  });
});
