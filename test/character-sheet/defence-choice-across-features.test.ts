import type { CharacterFeature } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import { DAMAGE_TYPE_NAMES, getFeatDefences } from '~character-sheet/model';

// Ответы пикер пишет подписями справочника типов урона: для проверки годятся
// любые три разных
const [FIRE = '', COLD = '', POISON = ''] = DAMAGE_TYPE_NAMES;

/**
 * Собирает особенность листа; остальные поля на защиты не влияют.
 *
 * @param patch поля особенности, важные для проверки.
 * @returns особенность листа.
 */
function createFeature(
  patch: Partial<CharacterFeature> & Pick<CharacterFeature, 'id' | 'origin'>,
): CharacterFeature {
  return {
    name: patch.id,
    description: [],
    originName: '',
    level: null,
    choice: null,
    ...patch,
  };
}

/** «Сопротивление урону» драконорождённого: защита по выбору соседнего умения. */
const resistanceTrait = createFeature({
  id: 'species:soprotivlenie-uronu',
  origin: 'species',
  originName: 'Драконорождённый',
  modifiers: {
    damage: {
      defenseChoices: [{ choiceKey: 'draconic-ancestry', kind: 'RESISTANCE' }],
    },
  },
});

describe('защита по выбору игрока', () => {
  it('берёт ответ у соседнего умения той же записи вида', () => {
    const ancestryTrait = createFeature({
      id: 'species:nasledie-drakonov',
      origin: 'species',
      originName: 'Драконорождённый',
      choiceAnswers: { 'draconic-ancestry': [FIRE] },
    });

    expect(
      getFeatDefences([ancestryTrait, resistanceTrait], 'feet').resistances,
    ).toEqual([FIRE]);
  });

  it('берёт ответ у самого умения, когда выбор лежит в нём же', () => {
    const ownChoiceTrait = createFeature({
      ...resistanceTrait,
      choiceAnswers: { 'draconic-ancestry': [COLD] },
    });

    expect(getFeatDefences([ownChoiceTrait], 'feet').resistances).toEqual([
      COLD,
    ]);
  });

  it('не берёт ответ у умения другой записи', () => {
    const foreignTrait = createFeature({
      id: 'lineage:chuzhoe-nasledie',
      origin: 'lineage',
      originName: 'Другой подвид',
      choiceAnswers: { 'draconic-ancestry': [POISON] },
    });

    expect(
      getFeatDefences([foreignTrait, resistanceTrait], 'feet').resistances,
    ).toEqual([]);
  });

  it('не делит ответ между чертами с одинаковым ключом выбора', () => {
    const answeredFeat = createFeature({
      id: 'feat:first',
      origin: 'feat',
      originName: 'Общая',
      choiceAnswers: { 'damage-type': [FIRE] },
    });

    const unansweredFeat = createFeature({
      id: 'feat:second',
      origin: 'feat',
      originName: 'Общая',
      modifiers: {
        damage: {
          defenseChoices: [{ choiceKey: 'damage-type', kind: 'RESISTANCE' }],
        },
      },
    });

    expect(
      getFeatDefences([answeredFeat, unansweredFeat], 'feet').resistances,
    ).toEqual([]);
  });
});
