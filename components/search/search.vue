<!--<script setup lang="ts"></script>-->

<template>
  <button :class="$style.searchBtn">
    <p :class="$style.searchText">
      Нажмите
      <span :class="$style.searchKeyWrapper">
        &nbsp; тут или
        <span :class="$style.searchKey">\</span>
        &nbsp;
      </span>
      для начала поиска
    </p>
  </button>
</template>

<style lang="scss" module>
  .searchBtn {
    cursor: pointer;

    position: relative;

    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;

    width: 100%;
    max-width: 600px;
    height: 46px;
    padding: 0 16px;

    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 36px;
  }

  .searchText {
    display: flex;
    align-items: center;
    margin-bottom: 0;
  }

  .searchKeyWrapper {
    @include media-max($md) {
      display: none;
    }
  }

  .searchKey {
    padding: 0 8px;

    font-weight: 600;
    color: var(--color-text-title);

    background-color: var(--color-bg-sub-menu);
    border-color: var(--color-border);
    border-style: solid;
    border-width: 1px;
    border-radius: 4px;
  }
</style>
