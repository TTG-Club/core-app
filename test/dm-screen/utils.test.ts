import { describe, expect, it } from 'vitest';

import {
  createScreenNotePath,
  DM_SCREEN_ICONS,
  getScreenEntryTitle,
  getScreenWindowIcon,
  isScreenEntryPath,
  isScreenNotePath,
  normalizeScreenEntryPath,
  resolveScreenEntry,
  toScreenNoteBlocks,
  toScreenPath,
  toScreenSearchEntries,
} from '~dm-screen/model';

describe('toScreenPath', () => {
  it('абсолютный адрес теряет протокол и домен', () => {
    expect(toScreenPath('https://ttg.club/spells/fireball')).toBe(
      '/spells/fireball',
    );
  });

  it('относительный адрес остаётся как есть', () => {
    expect(toScreenPath('/spells/fireball')).toBe('/spells/fireball');
  });
});

describe('resolveScreenEntry', () => {
  it('находит раздел и url записи', () => {
    const entry = resolveScreenEntry('/bestiary/goblin-mm');

    expect(entry?.section.path).toBe('bestiary');
    expect(entry?.url).toBe('goblin-mm');
  });

  it('магические предметы не путаются с предметами', () => {
    expect(resolveScreenEntry('/magic-items/bag')?.section.path).toBe(
      'magic-items',
    );
  });

  it('строка запроса и якорь к url записи не относятся', () => {
    expect(resolveScreenEntry('/spells/fireball?detail=x#top')?.url).toBe(
      'fireball',
    );
  });

  it('адрес раздела и незнакомые разделы — не записи', () => {
    expect(isScreenEntryPath('/spells')).toBe(false);
    expect(isScreenEntryPath('/spells/')).toBe(false);
    expect(isScreenEntryPath('/articles/some-news')).toBe(false);
    expect(isScreenEntryPath('/tools/dm-screen')).toBe(false);
  });
});

describe('normalizeScreenEntryPath', () => {
  it('убирает строку запроса, якорь и косую черту в конце', () => {
    expect(normalizeScreenEntryPath('/feats/alert/?from=list')).toBe(
      '/feats/alert',
    );
  });

  it('у чужого адреса пути на ширме нет', () => {
    expect(normalizeScreenEntryPath('/user/profile')).toBeUndefined();
  });
});

describe('заметки', () => {
  it('путь заметки отличается от адреса записи', () => {
    const path = createScreenNotePath('abc');

    expect(isScreenNotePath(path)).toBe(true);
    expect(isScreenNotePath('/spells/fireball')).toBe(false);
    expect(isScreenEntryPath(path)).toBe(false);
  });

  it('иконка окна: у заметки своя, у записи — раздела', () => {
    expect(getScreenWindowIcon(createScreenNotePath('abc'))).toBe(
      DM_SCREEN_ICONS.note,
    );

    expect(getScreenWindowIcon('/spells/fireball')).toBe('tabler:sparkles');
    expect(getScreenWindowIcon('/nowhere/x')).toBe(DM_SCREEN_ICONS.unknown);
  });

  it('сохранённая заметка делится на абзацы', () => {
    expect(toScreenNoteBlocks('["Первый абзац","Второй абзац"]')).toEqual([
      'Первый абзац',
      'Второй абзац',
    ]);
  });

  it('у пустой заметки абзацев нет', () => {
    expect(toScreenNoteBlocks('')).toEqual([]);
  });
});

describe('getScreenEntryTitle', () => {
  it('берёт русское название из объекта и из строки', () => {
    expect(
      getScreenEntryTitle({ name: { rus: 'Гоблин', eng: 'Goblin' } }),
    ).toBe('Гоблин');

    expect(getScreenEntryTitle({ name: 'Огненный шар' })).toBe('Огненный шар');
  });

  it('у ответа незнакомой формы названия нет', () => {
    expect(getScreenEntryTitle(null)).toBeUndefined();
    expect(getScreenEntryTitle({ title: 'x' })).toBeUndefined();
  });
});

describe('toScreenSearchEntries', () => {
  it('оставляет записи разделов ширмы и подписывает их разделом', () => {
    expect(
      toScreenSearchEntries({
        items: [
          {
            url: 'fireball-phb',
            type: 'spells',
            name: { rus: 'Огненный шар', eng: 'Fireball' },
          },
          { url: 'some-news', type: 'articles', name: { rus: 'Новость' } },
          { url: 'goblin-mm', type: 'bestiary', name: { rus: 'Гоблин' } },
        ],
      }),
    ).toEqual([
      {
        path: '/spells/fireball-phb',
        name: 'Огненный шар',
        englishName: 'Fireball',
        sectionLabel: 'Заклинания',
        icon: 'tabler:sparkles',
      },
      {
        path: '/bestiary/goblin-mm',
        name: 'Гоблин',
        englishName: undefined,
        sectionLabel: 'Бестиарий',
        icon: 'tabler:paw',
      },
    ]);
  });
});
