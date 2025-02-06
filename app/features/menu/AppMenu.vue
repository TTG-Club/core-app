<script setup lang="ts">
  import { SvgIcon } from '~/shared/ui';
  import { PopoverMenu } from './ui';

  const isShowMenu = ref(false);
</script>

<template>
  <PopoverMenu v-model="isShowMenu">
    <template #trigger>
      <AButton
        type="text"
        size="large"
        @click.left.exact.prevent="isShowMenu = !isShowMenu"
      >
        <template #icon>
          <SvgIcon icon="hamburger-menu" />
        </template>
      </AButton>
    </template>

    <template #default>
      <h4>Онлайн справочник по D&D 5e</h4>

      <h1>TTG Club</h1>

      <AFlex
        wrap="wrap"
        gap="large"
      >
        <ul
          v-for="item in new Array(6)"
          :key="item"
          :class="$style.menuList"
        >
          <li>
            <AFlex
              justify="space-between"
              align="center"
            >
              <span>Заголовок</span>

              <SvgIcon icon="hamburger-menu" />
            </AFlex>
          </li>

          <li><a href="/">Главная</a></li>

          <li><a href="/workshop">Мастерская</a></li>

          <li><a href="/species">Виды</a></li>
        </ul>
      </AFlex>
    </template>
  </PopoverMenu>
</template>

<style lang="scss" module>
  .menuList {
    min-width: 240px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
</style>
