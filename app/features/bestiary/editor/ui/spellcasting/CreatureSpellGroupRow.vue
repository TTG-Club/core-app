<script setup lang="ts">
  import type {
    CreatureSpellGroup,
    CreatureSpellUsageMode,
  } from '../../../model';

  import { EditorNestedSection } from '~ui/editor';
  import { SelectRecharge } from '~ui/select';
  import { InfoTooltip } from '~ui/tooltip';

  import {
    CREATURE_SPELL_REST_OPTIONS,
    CREATURE_SPELL_USAGE_MODE_OPTIONS,
    getCreatureSpellGroupLabel,
    isCreatureSpellCountMode,
    isCreatureSpellRestMode,
  } from '../../../model';
  import {
    CREATURE_SPELLCASTING_EDITOR,
    DEFAULT_CREATURE_SPELL_REST,
    MIN_CREATURE_SPELL_COUNT,
  } from '../../constants';
  import CreatureSpellRows from './CreatureSpellRows.vue';

  /**
   * Порция блока: список заклинаний под одним ограничением применений.
   *
   * Поля, не относящиеся к выбранному ограничению, прячутся, а не гаснут:
   * пустое поле «Перезарядка» у порции «По желанию» — вопрос, на который нет
   * ответа, и заполнить его нечем.
   */
  const model = defineModel<CreatureSpellGroup>({ required: true });

  const emit = defineEmits<{ remove: [] }>();

  /** Подпись шапки: своя, а без неё — собранная из ограничения. */
  const title = computed(() => getCreatureSpellGroupLabel(model.value));

  const isCountShown = computed(() =>
    isCreatureSpellCountMode(model.value.mode),
  );

  const isRestShown = computed(() => isCreatureSpellRestMode(model.value.mode));

  const isRechargeShown = computed(() => model.value.mode === 'RECHARGE');

  /**
   * Пояснение к числу применений: у «каждого» и «на весь список» одно и то же
   * число значит разное, и без подсказки их путают.
   */
  const countHint = computed(() =>
    model.value.mode === 'PER_DAY_EACH' || model.value.mode === 'PER_REST_EACH'
      ? CREATURE_SPELLCASTING_EDITOR.countEachHint
      : CREATURE_SPELLCASTING_EDITOR.countPoolHint,
  );

  /** Сколько заклинаний в порции; ноль — бейдж не показывается. */
  const spellCount = computed(
    () => model.value.spells.filter((spell) => Boolean(spell.url)).length,
  );

  /**
   * Меняет ограничение применений и заполняет поля, которые оно открывает.
   *
   * Пустыми их оставлять нельзя: в статблоке «N за отдых» без числа и без вида
   * отдыха не бывает, а пустое поле читалось бы как «неизвестно» и уехало бы
   * таким в выгрузку. Умолчания взяты самые частые — одно применение и
   * продолжительный отдых.
   *
   * @param mode - выбранное ограничение применений
   */
  function setMode(mode: CreatureSpellUsageMode): void {
    model.value.mode = mode;

    if (isCreatureSpellCountMode(mode) && model.value.count === undefined) {
      model.value.count = MIN_CREATURE_SPELL_COUNT;
    }

    if (isCreatureSpellRestMode(mode) && model.value.rest === undefined) {
      model.value.rest = DEFAULT_CREATURE_SPELL_REST;
    }
  }
</script>

<template>
  <div
    class="flex flex-col gap-3 rounded-lg border border-default bg-elevated/20 p-3 transition-colors focus-within:border-primary/60"
  >
    <div class="flex items-center justify-between gap-2">
      <span class="min-w-0 truncate text-sm font-medium text-highlighted">
        {{ title }}
      </span>

      <UBadge
        v-if="spellCount"
        color="primary"
        variant="subtle"
        size="sm"
        class="ml-auto shrink-0 tabular-nums"
      >
        {{ spellCount }}
      </UBadge>

      <UButton
        icon="tabler:trash"
        color="error"
        variant="ghost"
        size="xs"
        class="shrink-0"
        :aria-label="CREATURE_SPELLCASTING_EDITOR.removeGroup"
        @click.left.exact.prevent="emit('remove')"
      />
    </div>

    <!-- Поля порции строкой: их четыре, и часть показывается не всегда —
      в сетке на месте скрытых оставались бы дыры. Перенос на узком экране
      делает `flex-wrap` -->
    <div class="flex flex-wrap items-end gap-3">
      <UFormField
        class="w-full sm:w-60"
        :label="CREATURE_SPELLCASTING_EDITOR.mode"
      >
        <USelect
          :model-value="model.mode"
          :items="CREATURE_SPELL_USAGE_MODE_OPTIONS"
          value-key="value"
          class="w-full"
          @update:model-value="setMode"
        />
      </UFormField>

      <UFormField
        v-if="isCountShown"
        class="w-full sm:w-32"
      >
        <template #label>
          <InfoTooltip
            :text="countHint"
            icon="tabler:info-circle-filled"
          >
            <span>{{ CREATURE_SPELLCASTING_EDITOR.count }}</span>
          </InfoTooltip>
        </template>

        <UInputNumber
          v-model="model.count"
          :min="MIN_CREATURE_SPELL_COUNT"
          :placeholder="CREATURE_SPELLCASTING_EDITOR.countPlaceholder"
          :aria-label="CREATURE_SPELLCASTING_EDITOR.count"
        />
      </UFormField>

      <UFormField
        v-if="isRestShown"
        class="w-full sm:w-60"
        :label="CREATURE_SPELLCASTING_EDITOR.rest"
      >
        <USelect
          v-model="model.rest"
          :items="CREATURE_SPELL_REST_OPTIONS"
          value-key="value"
          class="w-full"
        />
      </UFormField>

      <UFormField
        v-if="isRechargeShown"
        class="w-full sm:w-48"
        :label="CREATURE_SPELLCASTING_EDITOR.recharge"
      >
        <SelectRecharge v-model="model.recharge" />
      </UFormField>

      <UFormField
        class="w-full min-w-40 sm:flex-1"
        :label="CREATURE_SPELLCASTING_EDITOR.groupLabel"
      >
        <UInput
          v-model="model.label"
          :placeholder="CREATURE_SPELLCASTING_EDITOR.groupLabelPlaceholder"
        />
      </UFormField>
    </div>

    <EditorNestedSection
      :title="CREATURE_SPELLCASTING_EDITOR.spells"
      :count="spellCount"
      :collapsible="false"
    >
      <CreatureSpellRows v-model="model.spells" />
    </EditorNestedSection>
  </div>
</template>
