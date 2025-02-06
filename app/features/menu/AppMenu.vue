<script setup lang="ts">
  import { SvgIcon } from '~/shared/ui';
  import { ContentMenu } from './ui';
</script>

<template>
  <ContentMenu
    :model-value="false"
    placement="right"
    :offset="20"
  >
    <template #default>
      <AButton
        type="text"
        size="large"
      >
        <template #icon>
          <SvgIcon icon="hamburger-menu" />
        </template>
      </AButton>
    </template>

    <template #content>
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
  </ContentMenu>
</template>

<style lang="scss" module>
  .menuList {
    min-width: 240px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
</style>
