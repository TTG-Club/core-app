<script setup lang="ts">
  import type { FeatDetailResponse } from '../../model';

  import { DictionaryService } from '~/shared/api';
  import { MarkupRender } from '~ui/markup';

  import { getFeatPrerequisiteText } from '../../model';
  import { COMPONENT_TOOLTIP_TEXT } from '../model';

  /**
   * Предварительное условие черты.
   *
   * Условие собирается из разобранных требований: они же сверяются листом, и
   * второй, набранный руками, текст того же смысла рано или поздно с ними
   * разойдётся. Строка остаётся запасным вариантом — её показывают, пока
   * требования у черты не разобраны.
   */
  const { prerequisite, prerequisiteDetails } =
    defineProps<
      Pick<FeatDetailResponse, 'prerequisite' | 'prerequisiteDetails'>
    >();

  /** Нужны ли подписи доспехов: без такого требования словарь не грузим. */
  const needsArmorLabels = computed<boolean>(
    () => !!prerequisiteDetails?.armorProficiency?.length,
  );

  // Свой ключ, не общий с селектом доспехов: тот грузит словарь всегда, а здесь
  // запрос нужен редкой черте — общий ключ отдал бы селекту пустой список
  const { data: armorCategories } = await useAsyncData(
    'feat-prerequisite-armor-categories',
    () =>
      needsArmorLabels.value
        ? DictionaryService.armorCategories()
        : Promise.resolve([]),
    { dedupe: 'defer', default: () => [] },
  );

  const armorLabels = computed<Map<string, string>>(
    () =>
      new Map(
        (armorCategories.value ?? []).map((category) => [
          category.value,
          category.label,
        ]),
      ),
  );

  /** Условие из разобранных требований; пусто — разбора у черты нет. */
  const composedPrerequisite = computed<string>(() =>
    getFeatPrerequisiteText(prerequisiteDetails, armorLabels.value),
  );
</script>

<template>
  <div :class="$style.stats">
    <div :class="$style.item">
      <UTooltip :text="COMPONENT_TOOLTIP_TEXT.prerequisite">
        <div :class="$style.name">Предварительное условие:</div>
      </UTooltip>

      <span v-if="composedPrerequisite">{{ composedPrerequisite }}</span>

      <!-- Разбора нет — показываем строку, как её набирали раньше -->
      <MarkupRender
        v-else
        :render-node="prerequisite"
      />
    </div>
  </div>
</template>

<style module lang="scss">
  .stats {
    container-type: inline-size;
    overflow: hidden;
    display: flex;
    flex-wrap: wrap;

    width: 100%;
    min-width: 272px;
    padding: 8px 0;
    border: 1px solid var(--ui-border);
    border-radius: 8px;

    background-color: var(--ui-bg-muted);

    .item {
      display: flex;
      flex: 1 0 100%;
      flex-direction: column;

      min-width: 100%;
      padding: 6px 16px;

      @container (width > 600px) {
        flex: 1 0 calc(100% / 3);
        min-width: calc(100% / 3);
        padding: 10px 24px;
      }

      &.block {
        flex: 1 0 100%;
        min-width: 100%;
        border-right: none;
      }

      &.duration {
        border-right: none;
      }

      .name {
        font-weight: 600;
        color: var(--ui-text-bold);
      }
    }
  }
</style>
