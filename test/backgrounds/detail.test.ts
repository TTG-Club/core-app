import type { BackgroundDetailResponse } from '~backgrounds/model';

import { describe, expect, it } from 'vitest';

import {
  getBackgroundEquipmentNode,
  getBackgroundFeatNode,
  getBackgroundToolNodes,
} from '~backgrounds/model';

/** Предыстория в том виде, в каком её отдаёт справочник после восстановления. */
const BACKGROUND: BackgroundDetailResponse = {
  url: 'dragonmarked-bravo-feq',
  name: { rus: 'Боец с драконьей меткой', eng: 'Dragonmarked Bravo' },
  abilityScores: 'Сила, Ловкость, Харизма',
  feat: '',
  skillProficiencies: 'Атлетика, Запугивание',
  toolChoice: {
    count: 1,
    from: [{ url: 'herbalism-kit-phb' }, { url: 'dice-set-phb' }],
  },
  startingEquipment: [
    { label: 'А', items: [], coins: 12, coin: 'зм' },
    { label: 'Б', items: [], coins: 50, coin: 'зм' },
  ],
  source: { url: 'feq', name: { label: 'FEQ', rus: '', eng: '' } },
  description: [],
  updatedAt: '2026-10-27T08:37:38Z',
};

describe('getBackgroundToolNodes', () => {
  it('подписывает ссылки без снимка названия названием из каталога', () => {
    const nodes = getBackgroundToolNodes(BACKGROUND, {
      categories: [],
      names: {
        'herbalism-kit-phb': 'Набор травника',
        'dice-set-phb': 'Игральные кости',
      },
    });

    expect(nodes).toEqual([
      'На выбор 1: {@item Набор травника|url:herbalism-kit-phb} или '
        + '{@item Игральные кости|url:dice-set-phb}',
    ]);
  });

  it('без каталога показывает адрес', () => {
    expect(getBackgroundToolNodes(BACKGROUND)).toEqual([
      'На выбор 1: {@item herbalism-kit-phb|url:herbalism-kit-phb} или '
        + '{@item dice-set-phb|url:dice-set-phb}',
    ]);
  });
});

describe('getBackgroundEquipmentNode', () => {
  it('берёт варианты, когда текста снаряжения нет', () => {
    expect(getBackgroundEquipmentNode(BACKGROUND)).toBe(
      'Выберите А или Б: (А) 12 зм; или (Б) 50 зм',
    );
  });

  it('варианты главнее прежнего текста', () => {
    expect(
      getBackgroundEquipmentNode({
        ...BACKGROUND,
        equipment: ['Старый текст'],
      }),
    ).toBe('Выберите А или Б: (А) 12 зм; или (Б) 50 зм');
  });

  it('без вариантов оставляет прежний текст', () => {
    expect(
      getBackgroundEquipmentNode({
        ...BACKGROUND,
        startingEquipment: [],
        equipment: ['Старый текст'],
      }),
    ).toEqual(['Старый текст']);
  });
});

describe('getBackgroundFeatNode', () => {
  const withFeatChoices: BackgroundDetailResponse = {
    ...BACKGROUND,
    featChoices: [
      { url: 'gathered-whispers-rhw' },
      { url: 'second-skin-rhw', name: 'Вторая кожа' },
    ],
  };

  it('подписывает черты без снимка названием из справочника', () => {
    expect(
      getBackgroundFeatNode(withFeatChoices, {
        'gathered-whispers-rhw': 'Собранные шёпоты',
      }),
    ).toBe(
      '{@feat Собранные шёпоты|url:gathered-whispers-rhw} или '
        + '{@feat Вторая кожа|url:second-skin-rhw}',
    );
  });

  it('без названий показывает адрес', () => {
    expect(getBackgroundFeatNode(withFeatChoices)).toBe(
      '{@feat gathered-whispers-rhw|url:gathered-whispers-rhw} или '
        + '{@feat Вторая кожа|url:second-skin-rhw}',
    );
  });
});
