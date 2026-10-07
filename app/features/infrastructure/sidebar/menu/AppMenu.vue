<script setup lang="ts">
  import {
    SUPPORT_EMAIL,
    SUPPORT_EMAIL_HREF,
    SUPPORT_EMAIL_ICON,
  } from '~/shared/consts';
  import { MulticlassDrawer } from '~classes/multiclass-drawer';
  import { HamburgerIcon, SvgLogo } from '~ui/icon';

  import { SidebarPopover } from '../popover';
  import {
    MENU_LINKS,
    MENU_SECTIONS,
    MENU_SITE_DESCRIPTION,
    MENU_SITE_TITLE,
    MENU_SUPPORT,
  } from './model';
  import { MenuContacts, MenuSection, MenuSupport } from './ui';

  const overlay = useOverlay();

  const multiclassDrawer = overlay.create(MulticlassDrawer, {
    props: {
      url: '',
      name: {
        rus: '',
        eng: '',
      },
      parent: undefined,
      onClose: () => multiclassDrawer.close(),
    },
    destroyOnClose: true,
  });

  const ACTION_HANDLERS: Record<string, () => void> = {
    'open-multiclass': () => multiclassDrawer.open(),
  };

  function handleMenuAction(actionId: string) {
    ACTION_HANDLERS[actionId]?.();
  }
</script>

<template>
  <SidebarPopover
    popover-key="app-menu"
    is-menu
  >
    <template #trigger="{ isOpened, toggle }">
      <HamburgerIcon
        :is-active="isOpened"
        @click.left.exact.prevent="toggle"
      />
    </template>

    <template #default>
      <header class="flex items-center gap-4 px-6 py-5">
        <NuxtLink
          :class="$style.logo"
          to="/"
        >
          <SvgLogo />
        </NuxtLink>

        <div class="flex min-w-0 flex-col gap-1">
          <span class="text-2xl leading-none font-semibold text-highlighted">
            {{ MENU_SITE_TITLE }}
          </span>

          <span class="text-sm text-muted">{{ MENU_SITE_DESCRIPTION }}</span>
        </div>
      </header>

      <USeparator />

      <nav :class="$style.navigation">
        <div :class="$style.content">
          <MenuSection
            v-for="section in MENU_SECTIONS"
            :key="section.label"
            v-bind="section"
            @action="handleMenuAction"
          />
        </div>
      </nav>

      <USeparator />

      <footer
        :class="$style.footer"
        class="bg-elevated/40 text-sm text-muted"
      >
        <div :class="$style.contacts">
          <MenuContacts :social-links="MENU_LINKS" />

          <USeparator
            :class="$style.divider"
            orientation="vertical"
            class="h-8"
          />

          <MenuSupport :support-items="MENU_SUPPORT" />

          <UButton
            :label="SUPPORT_EMAIL"
            :icon="SUPPORT_EMAIL_ICON"
            :href="SUPPORT_EMAIL_HREF"
            variant="link"
            color="neutral"
            :class="$style.email"
          />
        </div>
      </footer>
    </template>
  </SidebarPopover>
</template>

<style lang="scss" module>
  .logo {
    flex-shrink: 0;
    width: 56px;
  }

  // Колонки считаются от ширины самого меню, а не окна: меню уже окна
  .navigation {
    container-type: inline-size;
    padding: 24px 14px 0;
  }

  // Разделы идут сверху вниз и сами раскладываются по колонкам равной высоты,
  // поэтому под короткими разделами не остаётся пустых полей.
  .content {
    column-count: 2;
    column-gap: 12px;

    @container (width < 340px) {
      column-count: 1;
    }

    @container (width >= 620px) {
      column-count: 3;
    }

    @container (width >= 860px) {
      column-count: 4;
    }
  }

  .footer {
    container-type: inline-size;
  }

  .contacts {
    display: flex;
    flex-direction: column;
    gap: 4px 12px;
    padding: 10px 24px;

    @container (width >= 800px) {
      flex-direction: row;
      align-items: center;
    }

    .divider {
      display: none;

      @container (width >= 800px) {
        display: inline-block;
      }
    }

    .email {
      align-self: flex-start;
      padding-left: 0;

      @container (width >= 800px) {
        align-self: auto;
        margin-left: auto;
      }
    }
  }
</style>
