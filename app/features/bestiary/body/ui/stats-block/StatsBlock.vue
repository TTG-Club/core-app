<script setup lang="ts">
  import { CreatureAbilitiesTable } from './ui';

  import type { CreatureDetailResponse } from '~bestiary/types';

  defineProps<
    Pick<
      CreatureDetailResponse,
      | 'ac'
      | 'cr'
      | 'initiative'
      | 'hit'
      | 'speed'
      | 'abilities'
      | 'skills'
      | 'vulnerability'
      | 'resistance'
      | 'immunity'
      | 'sense'
      | 'languages'
    >
  >();
</script>

<template>
  <div :class="$style.stats">
    <div :class="$style.row">
      <div :class="$style.item">
        <span :class="$style.name">КД: </span>

        <span>{{ ac }}</span>
      </div>

      <div :class="$style.item">
        <span :class="$style.name">Инициатива: </span>

        <span>{{ initiative }}</span>
      </div>
    </div>

    <div :class="$style.item">
      <span :class="$style.name">Хиты: </span>

      <span> {{ hit.hit }} ({{ hit.formula }}) {{ hit.text }} </span>
    </div>

    <div :class="$style.item">
      <span :class="$style.name">Скорость: </span>

      <span>{{ speed }}</span>
    </div>

    <CreatureAbilitiesTable v-bind="abilities" />

    <div
      v-if="skills?.length"
      :class="$style.item"
    >
      <span :class="$style.name">Навыки: </span>

      <span>{{ skills }}</span>
    </div>

    <div
      v-if="vulnerability?.length"
      :class="$style.item"
    >
      <span :class="$style.name">Уязвимость: </span>

      <span>{{ vulnerability }}</span>
    </div>

    <div
      v-if="resistance?.length"
      :class="$style.item"
    >
      <span :class="$style.name">Сопротивление: </span>

      <span>{{ resistance }}</span>
    </div>

    <div
      v-if="immunity?.length"
      :class="$style.item"
    >
      <span :class="$style.name">Иммунитет: </span>

      <span>{{ immunity }}</span>
    </div>

    <span :class="$style.item">
      <span :class="$style.name">Чувства: </span>

      <span>{{ sense }}</span>
    </span>

    <div :class="$style.item">
      <span :class="$style.name">Языки: </span>

      <span>{{ languages }}</span>
    </div>

    <div :class="$style.item">
      <span :class="$style.name">ПО: </span>

      <span>{{ cr }}</span>
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
