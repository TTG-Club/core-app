import type { ChoiceOptionContext } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  collectChosenProficiencies,
  parseFeatDetail,
  resolveChoiceOptions,
} from '~character-sheet/model';

/** Знаниевые навыки «Благословения знаний» кодами словаря. */
const KNOWLEDGE_SKILL_KEYS = ['ARCANA', 'HISTORY', 'NATURE', 'RELIGION'];

/** Те же навыки подписями листа. */
const KNOWLEDGE_SKILL_NAMES = ['Аркана', 'История', 'Природа', 'Религия'];

/** Навык из перечня, которым жрец уже владеет. */
const OWNED_KNOWLEDGE_SKILL = 'История';

/** Навыки, которыми жрец владеет до выбора. */
const OWNED_SKILLS = [
  'Внимательность',
  'Проницательность',
  OWNED_KNOWLEDGE_SKILL,
];

/** Два навыка, которые игрок берёт из перечня. */
const PICKED_SKILLS = ['Аркана', 'Религия'];

/** Контекст пикера: полный каталог навыков и владения листа. */
const CHOICE_CONTEXT: ChoiceOptionContext = {
  skillNames: [...KNOWLEDGE_SKILL_NAMES, 'Внимательность', 'Проницательность'],
  proficientSkillNames: OWNED_SKILLS,
  chosenProficientSkills: [],
  knownLanguages: [],
  knownTools: [],
  allLanguages: [],
  allTools: [],
  ownedWeaponNames: [],
  proficientSavingThrowNames: [],
};

/** Сообщение теста, когда парсер не распознал выбор компетентности. */
const MISSING_CHOICE_MESSAGE = 'Выбор компетентности не распознан';

/**
 * Создаёт выбор компетентности из механики черты.
 *
 * @param onlyIfProficient отметка «только то, чем уже владеет»; undefined —
 * отметки в записи нет.
 * @param skillKeys коды навыков перечня.
 * @returns распознанный выбор листа.
 */
function createExpertiseChoice(
  onlyIfProficient: boolean | undefined,
  skillKeys: string[],
) {
  const feat = parseFeatDetail({
    url: 'expertise-feat',
    name: { rus: 'Компетентность' },
    category: 'GENERAL',
    description: [],
    mechanics: {
      choices: [
        {
          key: 'skills',
          type: 'SKILL',
          label: 'Выберите 2 навыка',
          count: PICKED_SKILLS.length,
          grants: 'EXPERTISE',
          onlyIfProficient,
          options: skillKeys.map((skillKey) => ({ value: skillKey })),
        },
      ],
    },
  });

  const expertiseChoice = feat?.choices.find(
    (featChoice) => featChoice.kind === 'skill-expertise',
  );

  if (!expertiseChoice) {
    throw new Error(MISSING_CHOICE_MESSAGE);
  }

  return expertiseChoice;
}

describe('выбор компетентности в навыке', () => {
  it('со снятой отметкой предлагает перечень и даёт владение', () => {
    const expertiseChoice = createExpertiseChoice(false, KNOWLEDGE_SKILL_KEYS);

    expect(resolveChoiceOptions(expertiseChoice, CHOICE_CONTEXT)).toEqual(
      KNOWLEDGE_SKILL_NAMES,
    );

    const granted = collectChosenProficiencies(
      [expertiseChoice],
      { [expertiseChoice.id]: PICKED_SKILLS },
      OWNED_SKILLS,
    );

    expect(granted.skills).toEqual(PICKED_SKILLS);
    expect(granted.expertiseSkills).toEqual(PICKED_SKILLS);
  });

  it('с отметкой сужает владения листа перечнем', () => {
    const expertiseChoice = createExpertiseChoice(true, KNOWLEDGE_SKILL_KEYS);

    expect(resolveChoiceOptions(expertiseChoice, CHOICE_CONTEXT)).toEqual([
      OWNED_KNOWLEDGE_SKILL,
    ]);

    const granted = collectChosenProficiencies(
      [expertiseChoice],
      { [expertiseChoice.id]: [OWNED_KNOWLEDGE_SKILL] },
      OWNED_SKILLS,
    );

    expect(granted.skills).toEqual([]);
    expect(granted.expertiseSkills).toEqual([OWNED_KNOWLEDGE_SKILL]);
  });

  it('без перечня и отметки берёт все владения листа', () => {
    const expertiseChoice = createExpertiseChoice(undefined, []);

    expect(resolveChoiceOptions(expertiseChoice, CHOICE_CONTEXT)).toEqual(
      OWNED_SKILLS,
    );
  });
});
