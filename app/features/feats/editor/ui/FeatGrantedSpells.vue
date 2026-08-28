<script setup lang="ts">
  import type {
    FeatEditorLabelOverrides,
    FeatEntityRef,
    FeatSpellGrant,
  } from '../../model';

  import { InfoTooltip } from '~ui/tooltip';

  import { getFeatEditorLabels } from '../../model';
  import FeatEntityRefRows from './FeatEntityRefRows.vue';

  /**
   * Заклинания, которые черта даёт знать без выбора, и настройка подготовки.
   *
   * Заклинательная характеристика здесь не задаётся: она одна на все заклинания
   * черты — и выданные, и выбранные игроком, — поэтому живёт своим блоком
   * (`FeatSpellcastingAbility`), а не рядом с одним из списков.
   */
  const model = defineModel<FeatSpellGrant>({ required: true });

  const { labels = {} } = defineProps<{
    /**
     * Подписи формы-владельца: чертой источник даров называет только форма
     * черты, у умения класса и вида свои формулировки.
     */
    labels?: FeatEditorLabelOverrides;
  }>();

  /** Подписи с поправками формы-владельца. */
  const texts = computed(() => getFeatEditorLabels(labels));

  /**
   * Уровень строки. Слот отдаёт ссылку из общего списка, поэтому уровень
   * читается и пишется по ней, а не по номеру строки.
   *
   * @param entry ссылка строки.
   * @returns уровень доступа; `undefined` — заклинание приходит сразу.
   */
  function getRequiredLevel(entry: FeatEntityRef): number | undefined {
    return model.value.spells.find((spell) => spell.url === entry.url)
      ?.requiredLevel;
  }

  /**
   * Записывает уровень доступа. Пустое поле — «сразу при взятии»: отдельного
   * значения для первого уровня не нужно, так же его читает и core-api.
   *
   * @param entry ссылка строки.
   * @param level уровень персонажа; пусто — заклинание приходит сразу.
   */
  function setRequiredLevel(entry: FeatEntityRef, level: number | undefined) {
    model.value = {
      ...model.value,
      spells: model.value.spells.map((spell) =>
        spell.url === entry.url ? { ...spell, requiredLevel: level } : spell,
      ),
    };
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <InfoTooltip
      :text="texts.grantedSpellsHint"
      icon="tabler:info-circle-filled"
      class="text-sm text-dimmed"
    >
      <span>{{ texts.grantedSpellsTitle }}</span>
    </InfoTooltip>

    <FeatEntityRefRows
      v-model="model.spells"
      kind="SPELL"
    >
      <!-- Уровень доступа — своим полем в строке: заклинание приходит не
        всегда сразу, а по достижении уровня персонажа -->
      <template #row="{ entry }">
        <InfoTooltip
          :text="texts.grantedSpellLevelHint"
          icon="tabler:info-circle-filled"
          class="shrink-0 text-xs text-dimmed"
        >
          <span>{{ texts.grantedSpellLevel }}</span>
        </InfoTooltip>

        <UInputNumber
          :model-value="getRequiredLevel(entry)"
          :min="1"
          :max="20"
          size="sm"
          class="w-32 shrink-0"
          :placeholder="texts.grantedSpellLevelPlaceholder"
          :aria-label="texts.grantedSpellLevel"
          @update:model-value="setRequiredLevel(entry, $event)"
        />
      </template>
    </FeatEntityRefRows>

    <!-- Без заклинаний подготовке не к чему применяться -->
    <div
      v-if="model.spells.length"
      class="flex items-center"
    >
      <InfoTooltip
        :text="texts.alwaysPreparedHint"
        icon="tabler:info-circle-filled"
      >
        <UCheckbox
          v-model="model.alwaysPrepared"
          :label="texts.alwaysPrepared"
        />
      </InfoTooltip>
    </div>
  </div>
</template>
