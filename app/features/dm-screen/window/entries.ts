import type { Component } from 'vue';

// Карточки разделов тяжёлые, а окно показывает одну: каждая подгружается,
// когда запись её раздела впервые встаёт на ширму

/**
 * Карточка записи по адресу её раздела. Каждая принимает загруженную
 * запись в пропе, названном в разделе (`bodyProp`).
 */
export const DM_SCREEN_ENTRY_BODIES: Readonly<Record<string, Component>> = {
  'spells': defineAsyncComponent(() =>
    import('~spells/body').then((module) => module.SpellBody),
  ),
  'bestiary': defineAsyncComponent(() =>
    import('~bestiary/body').then((module) => module.CreatureBody),
  ),
  'glossary': defineAsyncComponent(() =>
    import('~glossary/body').then((module) => module.GlossaryBody),
  ),
  'magic-items': defineAsyncComponent(() =>
    import('~magic-items/body').then((module) => module.MagicItemBody),
  ),
  'items': defineAsyncComponent(() =>
    import('~items/body').then((module) => module.ItemBody),
  ),
  'feats': defineAsyncComponent(() =>
    import('~feats/body').then((module) => module.FeatBody),
  ),
  'backgrounds': defineAsyncComponent(() =>
    import('~backgrounds/body').then((module) => module.BackgroundBody),
  ),
  'species': defineAsyncComponent(() =>
    import('~species/body').then((module) => module.SpeciesBody),
  ),
  'classes': defineAsyncComponent(() =>
    import('~classes/body').then((module) => module.ClassBody),
  ),
};
