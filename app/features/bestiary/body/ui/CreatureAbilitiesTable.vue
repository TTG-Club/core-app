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
  <AFlex vertical>
    <AFlex
      ><AFlex class="empty"></AFlex>

      <AFlex class="header">Мод</AFlex>

      <AFlex class="header">Спас</AFlex>

      <AFlex class="empty"></AFlex>

      <AFlex class="header">Мод</AFlex>

      <AFlex class="header">Спас</AFlex>

      <AFlex class="empty"></AFlex>

      <AFlex class="header">Мод</AFlex>

      <AFlex class="header">Спас</AFlex>
    </AFlex>

    <AFlex
      ><AFlex class="ability">Сил</AFlex>

      <AFlex class="cell">{{ props.abilities.str.mod }}</AFlex>

      <AFlex
        class="cell"
        :class="{ boxed: abilities.str.mod !== abilities.str.sav }"
        >{{ props.abilities.str.sav }}</AFlex
      >

      <AFlex class="ability">Лов</AFlex>

      <AFlex class="cell">{{ props.abilities.dex.mod }}</AFlex>

      <AFlex class="cell">{{ props.abilities.dex.sav }}</AFlex>

      <AFlex class="ability">Тел</AFlex>

      <AFlex class="cell">{{ props.abilities.con.mod }}</AFlex>

      <AFlex class="cell">{{ props.abilities.con.sav }}</AFlex>
    </AFlex>

    <AFlex
      ><AFlex class="ability"><strong>Инт</strong></AFlex>

      <AFlex class="cell">{{ props.abilities.int.mod }}</AFlex>

      <AFlex class="cell">{{ props.abilities.int.sav }}</AFlex>

      <AFlex class="ability">Мдр</AFlex>

      <AFlex class="cell">{{ props.abilities.wis.mod }}</AFlex>

      <AFlex class="cell">{{ props.abilities.wis.sav }}</AFlex>

      <AFlex class="ability">Хар</AFlex>

      <AFlex class="cell">{{ props.abilities.chr.mod }}</AFlex>

      <AFlex class="cell">{{ props.abilities.chr.sav }}</AFlex>
    </AFlex>
  </AFlex>
</template>

<style scoped>
  .ability {
    min-width: 40px;
    padding: 4px 4px;
    border: 2px solid #999;

    font-family: serif;
    font-size: 15px;
    text-align: left;
  }
  .cell {
    width: 33px;
    padding: 7px 4px;
    border: 1px solid #999;

    color: var(--color-text-title);
    text-align: center;
  }
  .header {
    font-weight: bold;
  }
  .empty {
    width: 40px;
    min-width: 40px;
    min-height: 40px;
    margin-left: 40px;
  }
  .boxed {
    border: 2px solid #ca5b5b;
  }
</style>
