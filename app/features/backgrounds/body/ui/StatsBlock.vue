<script setup lang="ts">
  import { COMPONENT_TOOLTIP_TEXT } from '../model';

  import { MarkupRender } from '~ui/markup';
  import { InfoTooltip } from '~ui/tooltip';
  import { RowRender } from '~ui/markup/ui';

  defineProps<{
    abilityScores: string;
    feat: string;
    skillProficiencies: string;
    toolProficiency: string[];
    equipment: string[];
  }>();
</script>

<template>
  <div :class="$style.stats">
    <div :class="$style.item">
      <InfoTooltip
        :class="$style.name"
        :text="COMPONENT_TOOLTIP_TEXT.abilities"
      >
        Характеристики
      </InfoTooltip>

      <span>{{ abilityScores }}</span>
    </div>

    <div :class="$style.item">
      <InfoTooltip
        :class="$style.name"
        :text="COMPONENT_TOOLTIP_TEXT.feat"
      >
        Черта
      </InfoTooltip>

      <RowRender :entry="feat" />
    </div>

    <div :class="$style.item">
      <InfoTooltip
        :class="$style.name"
        :text="COMPONENT_TOOLTIP_TEXT.skills"
      >
        Навыки
      </InfoTooltip>

      <span>{{ skillProficiencies }}</span>
    </div>

    <div :class="$style.item">
      <InfoTooltip
        :class="$style.name"
        :text="COMPONENT_TOOLTIP_TEXT.tool"
      >
        Владение инструментами
      </InfoTooltip>

      <MarkupRender :entries="toolProficiency" />
    </div>

    <div :class="[$style.item, $style.block]">
      <span :class="$style.name">Снаряжение:</span>

      <MarkupRender :entries="equipment" />
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
