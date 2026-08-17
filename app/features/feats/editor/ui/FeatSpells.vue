<script setup lang="ts">
  import type { AbilityKey } from '~/shared/types';

  import type { FeatSpellGrant } from '../../model';

  import { SelectAbilities, SelectSpell } from '~ui/select';

  import { FEAT_SPELL_EDITOR, toEntityRefUrls } from '../../model';

  const model = defineModel<FeatSpellGrant>({ required: true });

  const selectedUrls = computed<Array<string>>(() =>
    toEntityRefUrls(model.value.spells),
  );

  /**
   * Заклинательная характеристика приходит из селекта одиночным значением, но
   * тот же селект умеет и множественный выбор, поэтому список сводится к первому
   * значению — второму в блоке места нет.
   */
  const spellcastingAbility = computed<
    AbilityKey | Array<AbilityKey> | undefined
  >({
    get: () => model.value.spellcastingAbility,
    set: (value) => {
      model.value = {
        ...model.value,
        spellcastingAbility: Array.isArray(value) ? value[0] : value,
      };
    },
  });

  const alwaysPrepared = computed<boolean>({
    get: () => model.value.alwaysPrepared,
    set: (value) => {
      model.value = { ...model.value, alwaysPrepared: value };
    },
  });

  /** Добавляет пустую строку заклинания. */
  function addSpell(): void {
    model.value = {
      ...model.value,
      spells: [...model.value.spells, { url: '' }],
    };
  }

  function removeSpell(index: number): void {
    model.value = {
      ...model.value,
      spells: model.value.spells.filter((_, position) => position !== index),
    };
  }

  /**
   * Заклинание пишется ссылкой без снимка названия: круг и школу лист берёт из
   * справочника по url, и снимок здесь разошёлся бы с каталогом при правке
   * заклинания.
   *
   * @param index номер строки в списке.
   * @param url url выбранного заклинания.
   */
  function setSpell(index: number, url: string): void {
    model.value = {
      ...model.value,
      spells: model.value.spells.map((spell, position) =>
        position === index ? { url } : spell,
      ),
    };
  }

  /** Уже выбранные заклинания, кроме значения самой строки. */
  function getExcludedUrls(currentUrl: string): Array<string> {
    return selectedUrls.value.filter((url) => url !== currentUrl);
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between gap-4">
      <span class="text-sm text-dimmed">
        {{ FEAT_SPELL_EDITOR.description }}
      </span>

      <UButton
        icon="tabler:plus"
        size="xs"
        variant="ghost"
        @click.left.exact.prevent="addSpell"
      >
        {{ FEAT_SPELL_EDITOR.addLabel }}
      </UButton>
    </div>

    <p
      v-if="!model.spells.length"
      class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-dimmed italic"
    >
      {{ FEAT_SPELL_EDITOR.emptyHint }}
    </p>

    <div
      v-for="(spell, index) in model.spells"
      :key="index"
      class="grid grid-cols-24 items-end gap-2 rounded-lg border border-default bg-elevated/50 p-3"
    >
      <UFormField
        class="col-span-full md:col-span-23"
        :label="FEAT_SPELL_EDITOR.spellLabel"
      >
        <SelectSpell
          :model-value="spell.url"
          :exclude-urls="getExcludedUrls(spell.url)"
          @update:model-value="setSpell(index, $event)"
        />
      </UFormField>

      <div class="col-span-full flex justify-end md:col-span-1">
        <UButton
          color="error"
          icon="tabler:trash"
          size="xs"
          variant="ghost"
          @click.left.exact.prevent="removeSpell(index)"
        />
      </div>
    </div>

    <!-- Без заклинаний настраивать нечего: характеристике и подготовке не к чему
      применяться -->
    <div
      v-if="model.spells.length"
      class="grid grid-cols-1 gap-4 md:grid-cols-24"
    >
      <UFormField
        class="md:col-span-12"
        :label="FEAT_SPELL_EDITOR.abilityLabel"
        :help="FEAT_SPELL_EDITOR.abilityHelp"
      >
        <SelectAbilities v-model="spellcastingAbility" />
      </UFormField>

      <UFormField
        class="md:col-span-12"
        :label="FEAT_SPELL_EDITOR.alwaysPreparedLabel"
      >
        <UCheckbox v-model="alwaysPrepared" />
      </UFormField>
    </div>
  </div>
</template>
