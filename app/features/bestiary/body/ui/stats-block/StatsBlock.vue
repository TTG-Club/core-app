<script setup lang="ts">
  import { DiceRollerLink } from '~dice-roller/link';
  import { MarkupRender } from '~ui/markup';

  import { CreatureAbilitiesTable } from './ui';

  import type { CreatureDetailResponse } from '~bestiary/types';

  type Props = Pick<
    CreatureDetailResponse,
    'ac' | 'cr' | 'initiative' | 'hit' | 'speed' | 'abilities'
  > &
    Pick<
      Partial<CreatureDetailResponse>,
      | 'skills'
      | 'equipments'
      | 'vulnerability'
      | 'resistance'
      | 'immunity'
      | 'sense'
      | 'languages'
    >;

  defineProps<Props>();
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

        <span>
          <DiceRollerLink :notation="`1к20${initiative.value}`">
            {{ initiative.value }}
          </DiceRollerLink>
          ({{ initiative.label }})
        </span>
      </div>
    </div>

    <div :class="$style.item">
      <span :class="$style.name">Хиты: </span>

      <span>
        {{ hit.hit }}
        <span v-if="hit.formula">
          (<DiceRollerLink :notation="`{(${hit.formula}), 1}вл1`">
            {{ hit.formula }} </DiceRollerLink
          >)
        </span>
        {{ hit.text }}
      </span>
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

      <span>
        <template
          v-for="(skill, index) in skills"
          :key="`${skill.label}-${index}`"
        >
          <span v-if="index > 0">, </span>

          <span>{{ skill.label }} </span>&nbsp;

          <DiceRollerLink :notation="`1к20${skill.value}`">
            {{ skill.value }}
          </DiceRollerLink>
        </template>
      </span>
    </div>

    <div
      v-if="equipments"
      :class="$style.item"
    >
      <span :class="$style.name">Снаряжение: </span>

      <MarkupRender :render-node="equipments" />
    </div>

    <div
      v-if="vulnerability"
      :class="$style.item"
    >
      <span :class="$style.name">Уязвимости: </span>

      <span>{{ vulnerability }}</span>
    </div>

    <div
      v-if="resistance"
      :class="$style.item"
    >
      <span :class="$style.name">Сопротивления: </span>

      <span>{{ resistance }}</span>
    </div>

    <div
      v-if="immunity"
      :class="$style.item"
    >
      <span :class="$style.name">Иммунитеты: </span>

      <span>{{ immunity }}</span>
    </div>

    <span
      v-if="sense"
      :class="$style.item"
    >
      <span :class="$style.name">Чувства: </span>

      <span>{{ sense }}</span>
    </span>

    <div
      v-if="languages"
      :class="$style.item"
    >
      <span :class="$style.name">Языки: </span>

      <span>{{ languages }}</span>
    </div>

    <div :class="$style.item">
      <UTooltip text="Показатель опасности (CR)">
        <span :class="$style.name">ПО: </span>
      </UTooltip>

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
    border: 1px solid var(--ui-border);
    border-radius: 8px;

    background-color: var(--ui-bg-muted);

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
        font-weight: 600;
        color: var(--ui-text-bold);
      }
    }
  }
</style>
