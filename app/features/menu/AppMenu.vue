<script setup lang="ts">
  import { SvgIcon, SvgLogo } from '~/shared/ui';
  import { PopoverMenu } from './ui';

  const isShowMenu = ref(false);
</script>

<template>
  <PopoverMenu v-model="isShowMenu">
    <template #trigger="{ isShow }">
      <div
        :class="[$style.hamburger, { [$style.isActive]: isShow }]"
        @click.left.exact.prevent="isShowMenu = !isShowMenu"
      >
        <span :class="$style.line" />

        <span :class="$style.line" />

        <span :class="$style.line" />
      </div>
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
          <span :class="$style.description">
            Онлайн справочник по D&D 5e 2024
          </span>

          <span :class="$style.title">TTG Club</span>
        </AFlex>
      </AFlex>

      <ADivider :style="{ margin: '12px 0' }" />

      <AFlex
        wrap="wrap"
        gap="40"
        :class="$style.content"
      >
        <AFlex
          v-for="item in new Array(6)"
          :key="item"
          :class="$style.menu"
          vertical
        >
          <AFlex
            align="center"
            gap="8"
            :class="$style.title"
          >
            <SvgIcon icon="menu/filled/character" />

            <span>Заголовок</span>
          </AFlex>

          <a
            :class="$style.item"
            href="/"
          >
            Главная
          </a>

          <a
            :class="$style.item"
            href="/workshop"
          >
            Мастерская
          </a>

          <a
            :class="$style.item"
            href="/species"
          >
            Виды
          </a>

          <a
            :class="$style.item"
            href="/"
          >
            Заклинания
          </a>
        </AFlex>
      </AFlex>

      <ADivider :style="{ margin: '12px 0' }" />

      <AFlex
        :class="$style.footer"
        gap="small"
        wrap="wrap"
      >
        <AFlex
          gap="small"
          align="center"
        >
          <span>Контакты:</span>

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

        <ADivider
          type="vertical"
          :style="{ height: '32px' }"
        />

        <AFlex
          gap="small"
          align="center"
          wrap="wrap"
        >
          <span>Поддержка:</span>

          <AButton
            type="text"
            href="https://boosty.to/dnd5club"
            target="_blank"
          >
            <template #icon>
              <SvgIcon icon="boosty" />
            </template>

            <template #default> TTG Club </template>
          </AButton>

          <AButton
            type="text"
            href="https://boosty.to/dnd5eclub"
            target="_blank"
          >
            <template #icon>
              <SvgIcon icon="boosty" />
            </template>

            <template #default>Magistrus</template>
          </AButton>
        </AFlex>
      </AFlex>
    </template>
  </PopoverMenu>
</template>

<style lang="scss" module>
  .header {
    padding: 24px 24px 12px 24px;
  }

  .logo {
    width: 70px;
    height: 70px;
  }

  .title {
    font-size: 26px;
    font-weight: 600;
    line-height: 36px;
    color: var(--color-text-title);
  }

  .content {
    padding: 12px 16px;
  }

  .menu {
    width: 100%;
    min-width: 200px;
    max-width: 240px;
    margin: 0;
    padding: 0;

    list-style: none;

    .title {
      margin-bottom: 4px;
      padding: 0 8px;

      font-size: 13px;
      font-weight: 200;
      color: var(--color-text-g);
    }

    .item {
      margin-left: 14px;
      padding: 6px 16px;
      color: var(--color-text);
      border-radius: 6px;

      &:hover {
        color: var(--color-text);
        background-color: var(--color-hover);
        transition: all 0.15s ease-in-out;
      }
    }
  }

  .footer {
    padding: 0 24px 12px 24px;
  }

  .hamburger {
    position: relative;
    display: block;
    height: auto;
    padding: 9px 9px;

    .line {
      display: block;

      width: 20px;
      height: 2px;
      margin: 4px auto;

      background-color: var(--color-background-thumb);
      border-radius: 2px;

      transition: all 0.3s ease-in-out;
    }

    &.isActive {
      .line {
        &:nth-child(2) {
          opacity: 0;
        }

        &:nth-child(1) {
          transform: translateY(6px) rotate(45deg) translate3d(0, 0, 0);
        }

        &:nth-child(3) {
          transform: translateY(-6px) rotate(-45deg) translate3d(0, 0, 0);
        }
      }
    }

    &:hover {
      cursor: pointer;

      .line {
        background-color: #fff;

        &:nth-child(1) {
          transform: translateX(-6px) translate3d(0, 0, 0);
          width: 14px;
        }
      }

      &.isActive {
        .line {
          &:nth-child(1) {
            transform: translateY(6px) rotate(45deg) translate3d(0, 0, 0);
            width: 20px;
          }
        }
      }
    }
  }
</style>
