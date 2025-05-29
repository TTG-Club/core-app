<script setup lang="ts">
  import CreatureAbilitiesTable from '~bestiary/body/ui/CreatureAbilitiesTable.vue';

  import type { CreatureDetailResponse } from '~bestiary/types';

  defineProps<{
    creature: CreatureDetailResponse;
  }>();
</script>

<template>
  <div :class="$style.stats">
    <div :class="$style.item">
      <ATooltip
        :mouse-enter-delay="0.7"
        title="Класс доспеха"
        destroy-tooltip-on-hide
      >
        <div :class="$style.name">КД:</div>
      </ATooltip>

      <span>{{ creature.AC }}</span>

      <div :class="$style.name">Инициатива:</div>

      <span>{{ creature.initiative }}</span>
    </div>

    <div :class="$style.item">
      <div :class="$style.name">Хиты:</div>

      <span
        >{{ creature.hit.hit }} ({{ creature.hit.formula }}){{
          creature.hit.text
        }}</span
      >
    </div>

    <div :class="$style.item">
      <div :class="$style.name">Скорость:</div>

      <span>{{ creature.speed }}</span>
    </div>

    <CreatureAbilitiesTable :abilities="creature.abilities" />

    <div
      v-if="creature.skills?.length"
      :class="$style.item"
    >
      <div :class="$style.name">Навыки:</div>

      <span>{{ creature.skills }}</span>
    </div>

    <div
      v-if="creature.vulnerability?.length"
      :class="$style.item"
    >
      <div :class="$style.name">Уязвимость:</div>

      <span>{{ creature.vulnerability }}</span>
    </div>

    <div
      v-if="creature.resistance?.length"
      :class="$style.item"
    >
      <div :class="$style.name">Сопротивление:</div>

      <span>{{ creature.resistance }}</span>
    </div>

    <div
      v-if="creature.immunity?.length"
      :class="$style.item"
    >
      <div :class="$style.name">Иммунитет:</div>

      <span>{{ creature.immunity }}</span>
    </div>

    <div :class="$style.item">
      <div :class="$style.name">Чувства:</div>

      <span>{{ creature.sense }}</span>
    </div>

    <div :class="$style.item">
      <div :class="$style.name">Языки:</div>

      <span>{{ creature.languages }}</span>
    </div>

    <div :class="$style.item">
      <div :class="$style.name">ПО:</div>

      <span>{{ creature.CR }}</span>
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
    border: 1px solid var(--color-border);
    border-radius: 8px;

    background-color: var(--color-bg-secondary);

    .item {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;

      min-width: 100%;
      padding: 3px 16px;

      @container (width > 600px) {
        flex: 1 0 calc(100% / 3);
        min-width: calc(100% / 3);
        padding: 10px 24px;
      }

      .name {
        font-weight: 500;
        color: var(--color-text-title);
      }
    }
  }
</style>
