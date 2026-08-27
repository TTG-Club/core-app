<script setup lang="ts">
  import type { FeatEntityRef } from '~feats/model';
  import type { SpeciesCreate } from '~species/model';

  import { FeatEntityRefRows } from '~feats/editor/ui';
  import { SPECIES_INNATE_SPELL_EDITOR } from '~species/model';
  import { InfoTooltip } from '~ui/tooltip';

  type InnateSpells = SpeciesCreate['innateSpells'];

  /**
   * Врождённые заклинания вида: список выбранных заклинаний и уровень, с
   * которого каждое появляется в листе.
   *
   * Строки те же, что у выдачи черты и предыстории: заклинание — ссылкой на
   * карточку, источник — бейджем, добавление — одним полем поиска снизу. Тем же
   * способом заклинание добавляется и в системе D&D: списки видов и классов
   * заполняют одни и те же люди, и разный порядок действий в двух местах путал
   * бы больше, чем экономил.
   */
  const innateSpells = defineModel<InnateSpells>({ default: () => [] });

  /**
   * Список для строк ссылок. Уровень хранится рядом со ссылкой, поэтому при
   * записи он переносится по url: строки отдают только сам набор ссылок.
   */
  const refs = computed<Array<FeatEntityRef>>({
    get: () =>
      innateSpells.value.map((innateSpell) => ({ url: innateSpell.spell })),
    set: (next) => {
      innateSpells.value = next.map((reference) => ({
        spell: reference.url,
        requiredLevel:
          getRequiredLevel(reference)
          ?? SPECIES_INNATE_SPELL_EDITOR.defaultCharacterLevel,
      }));
    },
  });

  /**
   * Уровень строки. Слот отдаёт ссылку из общего списка, поэтому уровень
   * читается и пишется по ней, а не по номеру строки.
   *
   * @param entry ссылка строки.
   * @returns уровень персонажа; `undefined` — заклинания в списке ещё нет.
   */
  function getRequiredLevel(entry: FeatEntityRef): number | undefined {
    return innateSpells.value.find(
      (innateSpell) => innateSpell.spell === entry.url,
    )?.requiredLevel;
  }

  /**
   * Записывает уровень, с которого заклинание доступно.
   *
   * @param entry ссылка строки.
   * @param level уровень персонажа.
   */
  function setRequiredLevel(entry: FeatEntityRef, level: number) {
    innateSpells.value = innateSpells.value.map((innateSpell) =>
      innateSpell.spell === entry.url
        ? { ...innateSpell, requiredLevel: level }
        : innateSpell,
    );
  }
</script>

<template>
  <div class="col-span-full flex flex-col gap-3">
    <InfoTooltip
      :text="SPECIES_INNATE_SPELL_EDITOR.description"
      icon="tabler:info-circle-filled"
      class="text-sm text-dimmed"
    >
      <span>{{ SPECIES_INNATE_SPELL_EDITOR.title }}</span>
    </InfoTooltip>

    <FeatEntityRefRows
      v-model="refs"
      kind="SPELL"
    >
      <!-- Уровень доступа — своим полем в строке: заклинание приходит не
        всегда сразу, а по достижении уровня персонажа -->
      <template #row="{ entry }">
        <span class="shrink-0 text-xs text-dimmed">
          {{ SPECIES_INNATE_SPELL_EDITOR.characterLevelShort }}
        </span>

        <UInputNumber
          :model-value="getRequiredLevel(entry)"
          :min="SPECIES_INNATE_SPELL_EDITOR.minimumCharacterLevel"
          :max="SPECIES_INNATE_SPELL_EDITOR.maximumCharacterLevel"
          size="sm"
          class="w-32 shrink-0"
          :aria-label="SPECIES_INNATE_SPELL_EDITOR.characterLevelLabel"
          @update:model-value="setRequiredLevel(entry, $event)"
        />
      </template>
    </FeatEntityRefRows>
  </div>
</template>
