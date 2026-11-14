import { describe, expect, it } from 'vitest';

import { getStartingEquipmentNode } from '~ui/starting-equipment';

describe('getStartingEquipmentNode', () => {
  it('собирает строку выбора «А или Б» с количеством и монетами', () => {
    const node = getStartingEquipmentNode([
      {
        label: 'А',
        items: [
          { url: 'spear-phb', name: 'Копьё', section: 'items' },
          { url: 'bolt-phb', name: 'Болт', quantity: 20, section: 'items' },
        ],
        coins: 12,
        coin: 'зм',
      },
      { label: 'Б', items: [], coins: 50, coin: 'зм' },
    ]);

    expect(node).toBe(
      'Выберите А или Б: (А) {@item Копьё|url:spear-phb}, '
        + '{@item Болт|url:bolt-phb} (20), 12 зм; или (Б) 50 зм',
    );
  });

  it('перечисляет три варианта через запятую и «или» перед последним', () => {
    const node = getStartingEquipmentNode([
      { label: 'А', coins: 4, coin: 'зм' },
      { label: 'Б', coins: 11, coin: 'зм' },
      { label: 'В', coins: 155, coin: 'зм' },
    ]);

    expect(node).toBe(
      'Выберите А, Б или В: (А) 4 зм; (Б) 11 зм; или (В) 155 зм',
    );
  });

  it('единственный вариант перечисляет без выбора, пустые пропускает', () => {
    const node = getStartingEquipmentNode([
      {
        items: [
          {
            url: 'potion-of-healing-dmg',
            name: 'Зелье лечения',
            section: 'magic-items',
          },
        ],
      },
      { items: [], coins: 0 },
    ]);

    expect(node).toBe('{@magicItem Зелье лечения|url:potion-of-healing-dmg}');
  });

  it('позицию без карточки пишет уточнением', () => {
    const node = getStartingEquipmentNode([
      { items: [{ description: 'музыкальный инструмент на выбор' }] },
    ]);

    expect(node).toBe('музыкальный инструмент на выбор');
  });

  it('без вариантов возвращает пустую строку', () => {
    expect(getStartingEquipmentNode(null)).toBe('');
    expect(getStartingEquipmentNode([])).toBe('');
  });
});
