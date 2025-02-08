<script setup lang="ts">
  import { SvgIcon, SvgLogo } from '~/shared/ui';
  import { PopoverMenu } from './ui';

  const isShowMenu = ref(false);
</script>

<template>
  <PopoverMenu v-model="isShowMenu">
    <template #trigger="{ isActive }">
      <AButton
        type="text"
        size="large"
        :class="{ [$style.isActive]: isActive }"
        @click.left.exact.prevent="isShowMenu = !isShowMenu"
      >
        <template #icon>
          <SvgIcon icon="hamburger-menu" />
        </template>
      </AButton>
    </template>

    <template #default>
      <AFlex
        :class="$style.header"
        gap="middle"
      >
        <NuxtLink
          :class="$style.logo"
          to="/"
        >
          <SvgLogo />
        </NuxtLink>

        <AFlex
          vertical
          justify="space-between"
        >
          <span :class="$style.titleDesc">Онлайн справочник по D&D 5e</span>

          <span :class="$style.titleName">TTG Club</span>
        </AFlex>
      </AFlex>

      <ADivider />

      <AFlex
        wrap="wrap"
        gap="32"
      >
        <AFlex
          v-for="item in new Array(6)"
          :key="item"
          :class="$style.menuList"
          vertical
        >
          <AFlex
            justify="space-between"
            align="center"
          >
            <span>Заголовок</span>

            <SvgIcon icon="hamburger-menu" />
          </AFlex>

          <div>
            <a href="/">Главная</a>
          </div>

          <div>
            <a href="/workshop">Мастерская</a>
          </div>

          <div>
            <a href="/species">Виды</a>
          </div>
        </AFlex>
      </AFlex>

      <ADivider />

      <AFlex>1</AFlex>
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

  .isActive {
    z-index: 200;
  }

  .header {
    padding: 16px 16px 0 16px;
  }

  .logo {
    width: 70px;
    height: 70px;
  }

  .titleDesc {
    color: #ffffff;
  }

  .titleName {
    font-size: 26px;
    line-height: 36px;
    color: #fff;
  }
</style>
