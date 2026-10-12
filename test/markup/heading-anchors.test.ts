import { describe, expect, it } from 'vitest';

import { getHeadingAnchor, withHeadingAnchors } from '~ui/markup/anchors';

/**
 * Содержание статьи строится из заголовков `{@h}`: каждый получает уникальный
 * id якоря, по которому пункт содержания прокручивает к нему страницу.
 */
describe('якоря заголовков для содержания', () => {
  it('собирает заголовки из сырой разметки в порядке появления', () => {
    const { headings } = withHeadingAnchors([
      '{@h Когда развивать предметы}Текст абзаца',
      '{@h Многократное развитие | level:2}',
    ]);

    expect(headings).toEqual([
      {
        id: 'heading-kogda-razvivat-predmety',
        text: 'Когда развивать предметы',
        level: 1,
      },
      {
        id: 'heading-mnogokratnoe-razvitie',
        text: 'Многократное развитие',
        level: 2,
      },
    ]);
  });

  it('различает одинаковые заголовки суффиксом', () => {
    const { headings } = withHeadingAnchors([
      '{@h Пример}',
      '{@h Пример 2}',
      '{@h Пример}',
      '{@h Пример}',
    ]);

    expect(headings.map((heading) => heading.id)).toEqual([
      'heading-primer',
      'heading-primer-2',
      'heading-primer-3',
      'heading-primer-4',
    ]);
  });

  it('кладёт id якоря в атрибуты узла заголовка, не меняя исходник', () => {
    const heading = {
      type: 'heading' as const,
      content: [{ type: 'text' as const, text: 'Раздел' }],
    };

    const { nodes } = withHeadingAnchors([heading]);
    const [anchored] = Array.isArray(nodes) ? nodes : [nodes];

    expect(anchored).toMatchObject({ attrs: { anchor: 'heading-razdel' } });
    expect(heading).not.toHaveProperty('attrs');
  });

  it('пропускает заголовки без текста', () => {
    const { headings } = withHeadingAnchors([{ type: 'heading', content: [] }]);

    expect(headings).toEqual([]);
  });

  it('читает якорь только из строкового атрибута', () => {
    expect(getHeadingAnchor({ type: 'heading', attrs: { anchor: 'x' } })).toBe(
      'x',
    );

    expect(getHeadingAnchor({ type: 'heading', attrs: { anchor: 1 } })).toBe(
      undefined,
    );
  });
});
