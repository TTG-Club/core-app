<script setup lang="ts">
  import type { FeatGrantedSpellRef } from '~feats/model';

  import { FeatEntityRefRows } from '~feats/editor/ui';
  import { SPECIES_INNATE_SPELL_EDITOR } from '~species/model';

  /**
   * Заклинания, которые даёт умение вида.
   *
   * Строки те же, что у выдачи черты и предыстории: заклинание — ссылкой на
   * карточку, круг и источник — бейджами, добавление — одним полем поиска
   * снизу.
   */
  const spells = defineModel<Array<FeatGrantedSpellRef>>({ required: true });

  const { featureLevel } = defineProps<{
    /**
     * Уровень самого умения. Показан подписью пустого поля: по умолчанию
     * заклинание приходит вместе с умением, и повторять его уровень у каждой
     * строки не нужно.
     */
    featureLevel: number | undefined;
  }>();

  /**
   * Уровень строки. Слот отдаёт ссылку из общего списка, поэтому уровень
   * читается и пишется по ней, а не по номеру строки.
   *
   * @param entry ссылка строки.
   * @returns уровень персонажа; `undefined` — заклинание приходит с умением.
   */
  function getRequiredLevel(entry: FeatGrantedSpellRef): number | undefined {
    return spells.value.find((spell) => spell.url === entry.url)?.requiredLevel;
  }

  /**
   * Записывает уровень, с которого заклинание доступно. Пустое поле — «вместе с
   * умением»: у тифлинга «Наследие преисподней» приходит с первого уровня, а
   * два его заклинания — с третьего и пятого.
   *
   * @param entry ссылка строки.
   * @param level уровень персонажа; пусто — заклинание приходит с умением.
   */
  function setRequiredLevel(
    entry: FeatGrantedSpellRef,
    level: number | undefined,
  ) {
    spells.value = spells.value.map((spell) =>
      spell.url === entry.url ? { ...spell, requiredLevel: level } : spell,
    );
  }
</script>

<template>
  <FeatEntityRefRows
    v-model="spells"
    kind="SPELL"
  >
    <!-- Уровень доступа — своим полем в строке: заклинание приходит не всегда
      вместе с умением, а по достижении уровня персонажа -->
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
        :placeholder="
          featureLevel
            ? String(featureLevel)
            : SPECIES_INNATE_SPELL_EDITOR.characterLevelPlaceholder
        "
        :aria-label="SPECIES_INNATE_SPELL_EDITOR.characterLevelLabel"
        @update:model-value="setRequiredLevel(entry, $event)"
      />
    </template>
  </FeatEntityRefRows>
</template>
