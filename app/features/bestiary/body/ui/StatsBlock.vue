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
        <div :class="$style.name">Класс доспеха:</div>

        <span>{{ creature.AC }}</span>
      </div>

      <div :class="$style.item">
        <div :class="$style.name">Инициатива:</div>

        <span>{{ creature.initiative }}</span>
      </div>

      <div :class="$style.item">
        <div :class="$style.name">Хиты:</div>

        <span
          >
          {{ creature.hit.hit }} ({{ creature.hit.formula }}) {{
            creature.hit.text
          }}
        </span
        >
      </div>

      <div :class="$style.item">
        <div :class="$style.name">Скорость:</div>

        <span>{{ creature.speed }}</span>
      </div>
    </div>

    <CreatureAbilitiesTable :abilities="creature.abilities" />

    <div :class="$style.row">
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
    </div>

    <div
      v-if="creature.immunity?.length"
      :class="$style.item"
    >
      <div :class="$style.name">Иммунитет:</div>

      <span>{{ creature.immunity }}</span>
    </div>

    <div :class="[$style.item, $style.w50]">
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
    padding: 8px 0;
    border: 1px solid var(--color-border);
    border-radius: 8px;

    background-color: var(--color-bg-secondary);

    .row {
      display: flex;
      flex-wrap: wrap;
      width: 100%;

      @container (width > 600px) {
        flex-wrap: nowrap;
      }

      .item {
        flex: 1;
        min-width: 50%;

        @container (width > 600px) {
          min-width: 0;
        }

        &.w50 {
          min-width: 50%;
        }
      }
    }

    .item {
      display: flex;
      flex: 1 0 100%;
      flex-direction: column;

      min-width: 100%;
      padding: 6px 16px;

      .name {
        font-weight: 500;
        color: var(--color-text-title);
      }
    }
  }
</style>
