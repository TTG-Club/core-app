<script setup lang="ts">
  import { SvgIcon, SvgLogo } from '~/shared/ui';
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
          <SvgIcon icon="menu/hamburger" />
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
          justify="space-around"
        >
          <span :class="$style.description"
            >Онлайн справочник по D&D 5e 2024</span
          >

          <span :class="$style.title">TTG Club</span>
        </AFlex>
      </AFlex>

      <ADivider />

      <AFlex
        wrap="wrap"
        gap="40"
        :class="$style.content"
      >
        <AFlex
          v-for="item in new Array(6)"
          :key="item"
          :class="$style.menuList"
          vertical
        >
          <AFlex
            align="center"
            gap="8"
            :class="$style.menuTitle"
          >
            <SvgIcon icon="menu/filled/character" />

            <span>Заголовок</span>
          </AFlex>

          <a
            :class="$style.menuItem"
            href="/"
            >Главная</a
          >

          <a
            :class="$style.menuItem"
            href="/workshop"
            >Мастерская</a
          >

          <a
            :class="$style.menuItem"
            href="/species"
            >Виды</a
          >

          <a
            :class="$style.menuItem"
            href="/"
            >Заклинания</a
          >
        </AFlex>
      </AFlex>

      <ADivider />

      <AFlex
        :class="$style.footer"
        gap="small"
        wrap="wrap"
      >
        <AFlex
          gap="small"
          align="center"
        >
          Контакты:
          <AButton
            type="text"
            href="https://vk.com/ttg.club"
            target="_blank"
          >
            <template #icon>
              <SvgIcon icon="vk" />
            </template>
          </AButton>

          <AButton
            type="text"
            href="https://discord.gg/JqFKMKRtxv"
            target="_blank"
          >
            <template #icon>
              <SvgIcon icon="discord" />
            </template>
          </AButton>

          <AButton
            type="text"
            href="https://t.me/ttgclubnews"
            target="_blank"
          >
            <template #icon>
              <SvgIcon icon="telegram" />
            </template>
          </AButton>

          <AButton
            type="text"
            href="https://www.youtube.com/channel/UCpFse6-P2IBXYfkesAxZbfA"
            target="_blank"
          >
            <template #icon>
              <SvgIcon icon="youtube" />
            </template>
          </AButton>
        </AFlex>

        <ADivider type="vertical" />

        <AFlex
          gap="small"
          align="center"
          wrap="wrap"
        >
          Поддержка:
          <AButton
            type="text"
            href="https://boosty.to/dnd5club"
            target="_blank"
          >
            <template #icon>
              <SvgIcon icon="boosty" />
            </template>
            TTG Club
          </AButton>

          <AButton
            type="text"
            href="https://boosty.to/dnd5eclub"
            target="_blank"
          >
            <template #icon>
              <SvgIcon icon="boosty" />
            </template>
            Magistrus
          </AButton>
        </AFlex>
      </AFlex>
    </template>
  </PopoverMenu>
</template>

<style lang="scss" module>
  .header {
    padding: 24px 24px 0 24px;
  }

  .logo {
    width: 70px;
    height: 70px;
  }

  .description {
    color: #ffffff;
  }

  .title {
    font-size: 26px;
    font-weight: 600;
    line-height: 36px;
    color: #fff;
  }

  .content {
    padding: 0 16px;
  }

  .menuList {
    width: 100%;
    min-width: 200px;
    max-width: 240px;
    margin: 0;
    padding: 0;

    list-style: none;
  }

  .menuTitle {
    margin-bottom: 4px;
    padding: 0 8px;
    font-size: 13px;
  }

  .menuItem {
    margin-left: 14px;
    padding: 6px 16px;
    color: #fff;
    border-radius: 6px;

    &:hover {
      color: #fff;
      background-color: #ffffff0a;
      transition: all 0.15s ease-in-out;
    }
  }

  .footer {
    padding: 0 24px 24px 24px;
  }
</style>
