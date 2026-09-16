import { describe, expect, it } from 'vitest';

import {
  buildBreadcrumbItems,
  buildBreadcrumbSchemaItems,
} from '~infrastructure/breadcrumbs/utils';

describe('buildBreadcrumbItems', () => {
  it('не строит крошки для главной', () => {
    expect(buildBreadcrumbItems('/')).toEqual([]);
  });

  it('добавляет раздел и заголовок страницы сущности', () => {
    expect(buildBreadcrumbItems('/spells/fireball', 'Огненный шар')).toEqual([
      { label: 'Главная', to: '/' },
      { label: 'Заклинания', to: '/spells' },
      { label: 'Огненный шар' },
    ]);
  });

  it('заканчивает крошки разделом, пока заголовок страницы не загружен', () => {
    expect(buildBreadcrumbItems('/spells/fireball')).toEqual([
      { label: 'Главная', to: '/' },
      { label: 'Заклинания', to: '/spells' },
    ]);
  });

  it('предпочитает название из карты заголовку страницы', () => {
    const items = buildBreadcrumbItems(
      '/workshop/spells',
      'Мастерская заклинаний',
    );

    expect(items.at(-1)).toEqual({ label: 'Заклинания' });
  });

  it('оставляет раздел без своей страницы текстом', () => {
    expect(
      buildBreadcrumbItems(
        '/calculators/abilities',
        'Калькулятор характеристик',
      ),
    ).toEqual([
      { label: 'Главная', to: '/' },
      { label: 'Инструменты', to: undefined },
      { label: 'Калькулятор характеристик' },
    ]);
  });

  it('пропускает неизвестные сегменты в середине пути', () => {
    expect(
      buildBreadcrumbItems('/games/42/edit', 'Редактирование игры'),
    ).toEqual([
      { label: 'Главная', to: '/' },
      { label: 'Поиск игр', to: '/games' },
      { label: 'Редактирование игры' },
    ]);
  });

  it('не повторяет раздел, когда страница сущности носит его название', () => {
    expect(
      buildBreadcrumbItems('/tools/initiative/42', 'Трекер инициативы'),
    ).toEqual([
      { label: 'Главная', to: '/' },
      { label: 'Инструменты', to: undefined },
      { label: 'Трекер инициативы', to: '/tools/initiative' },
    ]);
  });
});

describe('buildBreadcrumbSchemaItems', () => {
  it('размечает путь, оставляя последнюю крошку без адреса', () => {
    const items = buildBreadcrumbItems('/spells/fireball', 'Огненный шар');

    expect(buildBreadcrumbSchemaItems(items)).toEqual([
      { name: 'Главная', item: '/' },
      { name: 'Заклинания', item: '/spells' },
      { name: 'Огненный шар', item: undefined },
    ]);
  });

  it('пропускает крошки без названия', () => {
    expect(buildBreadcrumbSchemaItems([{ to: '/spells' }])).toEqual([]);
  });
});
