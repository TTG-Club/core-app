<script setup lang="ts">
  const open = ref<boolean>(false);

  const showModal = () => {
    open.value = true;
  };
</script>

<template>
  <AFlex
    vertical
    align="center"
    :class="$style.head"
  >
    <span :class="$style.title">D&D 2024 СПРАВОЧНИК</span>

    <div
      :class="$style.search"
      @click="showModal"
    >
      <p>
        Нажмите тут или <span :class="$style.key">\</span> для начала поиска
      </p>
    </div>

    <AModal
      v-model:open="open"
      :closable="false"
      :footer="null"
    >
      <AInput
        autofocus
        placeholder="Поиск по сайту"
        size="large"
      ></AInput>

      <ASpace
        direction="vertical"
        :class="$style.result"
      >
        <span>Результат ответа</span>

        <span>Результат ответа</span>

        <span>Результат ответа</span>

        <span>Результат ответа</span>

        <span>Результат ответа</span>

        <span>Результат ответа</span>

        <span>Результат ответа</span>

        <span>Результат ответа</span>
      </ASpace>
    </AModal>
  </AFlex>
</template>

<style lang="scss" module>
  .head {
    width: 100%;
    margin: 5vw 0 0 0;

    .title {
      display: none;
      margin-bottom: 16px;
      font-size: 3rem;
    }
  }

  .search {
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
    border: 1px solid var(--color-border);
    border-radius: 36px;

    background-color: var(--color-bg-secondary);

    p {
      margin: 0;
    }

    .key {
      padding: 0 8px;
      border-color: var(--color-border);
      border-style: solid;
      border-width: 1px;
      border-radius: 4px;

      font-weight: 600;
      color: var(--color-text-color-title);

      background-color: var(--color-bg-sub-menu);
    }
  }

  .result {
    width: 100%;
    margin-top: 16px;
  }
</style>
