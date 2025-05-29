<script setup lang="ts">
  import type { Ability } from '~bestiary/types'; // или путь к твоим типам

  const props = defineProps<{
    abilities: {
      str: Ability;
      dex: Ability;
      con: Ability;
      int: Ability;
      wis: Ability;
      chr: Ability;
    };
  }>();
</script>

<template>
  <div :class="$style.block">
    <div :class="$style.title">
      <div></div>

      <div>Мод</div>

      <div>Спас</div>

      <div></div>

      <div>Мод</div>

      <div>Спас</div>
    </div>

    <div :class="$style.ability">
      <div :class="$style.stat">Сил</div>

      <div>{{ props.abilities.str.mod }}</div>

      <div
        class="cell"
        :class="{ boxed: abilities.str.mod !== abilities.str.sav }"
      >
        {{ props.abilities.str.sav }}
      </div>

      <div :class="$style.stat">Инт</div>

      <div>{{ props.abilities.int.mod }}</div>

      <div>{{ props.abilities.int.sav }}</div>
    </div>

    <div :class="$style.ability">
      <div :class="$style.stat">Лов</div>

      <div>{{ props.abilities.dex.mod }}</div>

      <div>{{ props.abilities.dex.sav }}</div>

      <div :class="$style.stat">Мдр</div>

      <div>{{ props.abilities.wis.mod }}</div>

      <div>{{ props.abilities.wis.sav }}</div>
    </div>

    <div :class="$style.ability">
      <div :class="$style.stat">Тел</div>

      <div>{{ props.abilities.con.mod }}</div>

      <div>{{ props.abilities.con.sav }}</div>

      <div :class="$style.stat">Хар</div>

      <div>{{ props.abilities.chr.mod }}</div>

      <div>{{ props.abilities.chr.sav }}</div>
    </div>
  </div>
</template>

<style module lang="scss">
  .block {
    display: flex;
    flex-direction: column;

    width: 100%;
    margin: 6px 0;
    padding: 12px 16px;

    background: var(--color-hover);

    .title {
      display: flex;
      width: 100%;
      font-size: 12px;

      div {
        display: flex;
        flex: 1;
      }
    }

    .ability {
      display: flex;

      .stat {
        font-weight: 600;
        color: var(--color-text-bold);
        text-align: left;
      }

      div {
        display: flex;
        flex: 1;
      }
    }
  }
</style>
