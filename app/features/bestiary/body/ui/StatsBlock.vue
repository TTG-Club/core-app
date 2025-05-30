<script setup lang="ts">
  import CreatureAbilitiesTable from '~bestiary/body/ui/CreatureAbilitiesTable.vue';

  import type { CreatureDetailResponse } from '~bestiary/types';

  defineProps<{
    creature: CreatureDetailResponse;
  }>();
</script>

<template>
  <div :class="$style.stats">
    <div :class="$style.row">
      <div :class="$style.item">
        <span :class="$style.name">КД: </span>

        <span>{{ creature.AC }}</span>
      </div>

      <div :class="$style.item">
        <span :class="$style.name">Инициатива: </span>

        <span>{{ creature.initiative }}</span>
      </div>
    </div>

    <div :class="$style.item">
      <span :class="$style.name">Хиты: </span>

      <span>
        {{ creature.hit.hit }} ({{ creature.hit.formula }})
        {{ creature.hit.text }}
      </span>
    </div>

    <div :class="$style.item">
      <span :class="$style.name">Скорость: </span>

      <span>{{ creature.speed }}</span>
    </div>

    <CreatureAbilitiesTable :abilities="creature.abilities" />

    <div
      v-if="creature.skills?.length"
      :class="$style.item"
    >
      <span :class="$style.name">Навыки: </span>

      <span>{{ creature.skills }}</span>
    </div>

    <div
      v-if="creature.vulnerability?.length"
      :class="$style.item"
    >
      <span :class="$style.name">Уязвимость: </span>

      <span>{{ creature.vulnerability }}</span>
    </div>

    <div
      v-if="creature.resistance?.length"
      :class="$style.item"
    >
      <span :class="$style.name">Сопротивление: </span>

      <span>{{ creature.resistance }}</span>
    </div>

    <div
      v-if="creature.immunity?.length"
      :class="$style.item"
    >
      <span :class="$style.name">Иммунитет: </span>

      <span>{{ creature.immunity }}</span>
    </div>

    <span :class="$style.item">
      <span :class="$style.name">Чувства: </span>

      <span>{{ creature.sense }}</span>
    </span>

    <div :class="$style.item">
      <span :class="$style.name">Языки: </span>

      <span>{{ creature.languages }}</span>
    </div>

    <div :class="$style.item">
      <span :class="$style.name">ПО: </span>

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
    padding: 8px 0;
    border: 1px solid var(--color-border);
    border-radius: 8px;

    background-color: var(--color-bg-secondary);

    .row {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      width: 100%;

      @container (width > 600px) {
        justify-content: left;
      }

      .item {
        min-width: 0;
      }
    }

    .item {
      min-width: 100%;
      padding: 6px 16px;

      .name {
        font-weight: 500;
        color: var(--color-text-title);
      }
    }
  }
</style>
