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
      <div :class="$style.first"></div>

      <div :class="$style.first">Мод</div>

      <div :class="$style.first">Спас</div>

      <div :class="$style.first"></div>

      <div :class="$style.first">Мод</div>

      <div :class="$style.first">Спас</div>

      <div :class="$style.third"></div>

      <div :class="$style.third">Мод</div>

      <div :class="$style.third">Спас</div>
    </div>

    <div :class="$style.group">
      <div :class="$style.ability">
        <div>
          <div :class="$style.stat">Сил</div>

          <div>{{ props.abilities.str.mod }}</div>

          <div :class="{ boxed: abilities.str.mod !== abilities.str.sav }">
            {{ props.abilities.str.sav }}
          </div>
        </div>

        <div>
          <div :class="$style.stat">Лов</div>

          <div>{{ props.abilities.dex.mod }}</div>

          <div>{{ props.abilities.dex.sav }}</div>
        </div>

        <div>
          <div :class="$style.stat">Тел</div>

          <div>{{ props.abilities.con.mod }}</div>

          <div>{{ props.abilities.con.sav }}</div>
        </div>
      </div>

      <div :class="$style.ability">
        <div>
          <div :class="$style.stat">Инт</div>

          <div>{{ props.abilities.int.mod }}</div>

          <div>{{ props.abilities.int.sav }}</div>
        </div>

        <div>
          <div :class="$style.stat">Мдр</div>

          <div>{{ props.abilities.wis.mod }}</div>

          <div>{{ props.abilities.wis.sav }}</div>
        </div>

        <div>
          <div :class="$style.stat">Хар</div>

          <div>{{ props.abilities.chr.mod }}</div>

          <div>{{ props.abilities.chr.sav }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style module lang="scss">
  .block {
    display: flex;
    flex-direction: column;

    width: 100%;
    margin: 6px 12px;
    padding: 12px 16px;
    border-radius: 12px;

    background: var(--color-hover);

    @container (width > 600px) {
      width: 70%;
      margin-left: 16px;
    }

    .title {
      display: flex;
      width: 100%;
      font-size: 12px;

      .first {
        display: flex;
        flex: 1;
      }
    }

    .group {
      display: flex;

      @container (width > 600px) {
        flex-direction: column;
      }
    }

    .ability {
      display: flex;
      flex: 1;
      flex-direction: column;

      @container (width > 600px) {
        flex-direction: row;
      }

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

    .third {
      display: none;

      @container (width > 600px) {
        display: flex;
        flex: 1;
      }
    }
  }
</style>
