<script setup lang="ts">
  import {
    Breakpoint,
    useBreakpoints,
    useSidebarPopover,
  } from '~/shared/composables';
  import { AppMenu } from '~sidebar/menu';
  import { ThemeSwitcher } from '~sidebar/theme-switcher';
  import { UserHelmet } from '~sidebar/user-helmet';
  import { SvgLogo } from '~ui/icon';

  const route = useRoute();
  const { y } = useWindowScroll();
  const { smaller } = useBreakpoints();
  const { close } = useSidebarPopover();

  const isMobile = smaller(Breakpoint.MD);
  const hidden = useState('navbar-hidden', () => false);

  watchThrottled(
    y,
    (scroll, oldScroll) => {
      if (!isMobile.value) {
        return;
      }

      if (scroll < 56) {
        if (hidden.value) {
          hidden.value = false;
        }

        return;
      }

      hidden.value = scroll > oldScroll;
    },
    { throttle: 300 },
  );

  watch(isMobile, (value) => {
    if (value) {
      return;
    }

    hidden.value = false;
  });

  watch(
    () => route.fullPath,
    () => {
      close();
    },
    {
      immediate: true,
      deep: true,
    },
  );
</script>

<template>
  <div :class="[$style.navbar, { [$style.hidden]: hidden }]">
    <header :class="$style.header">
      <div :class="$style.main">
        <NuxtLink
          :class="$style.logo"
          to="/"
        >
          <SvgLogo />
        </NuxtLink>

        <ClientOnly>
          <AppMenu />
        </ClientOnly>
      </div>

      <div :class="$style.actions">
        <div :class="$style.socials" />

        <ClientOnly>
          <ThemeSwitcher />

          <UserHelmet />
        </ClientOnly>
      </div>
    </header>
  </div>
</template>

<style lang="scss" module>
  .navbar {
    position: fixed;
    z-index: 100;
    bottom: 0;
    left: 0;

    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;

    width: 100%;
    height: var(--navbar-height);
    padding-bottom: var(--safe-area-inset-bottom);
    border-top: 1px solid var(--color-border);
    border-right: 0;

    background-color: var(--color-bg-main);

    transition: bottom ease-in-out 0.2s;

    @include media-min($md) {
      top: 0;
      bottom: initial;

      flex-direction: column;
      flex-wrap: nowrap;

      width: var(--navbar-width);
      height: 100vh;
      padding-bottom: 0;
      padding-left: var(--safe-area-inset-left);
      border-top: 0;
      border-right: 1px solid var(--color-border);
    }

    &.hidden {
      bottom: calc(var(--navbar-height) * -1);
      transition: bottom ease-in-out 0.2s;

      @include media-min($md) {
        bottom: initial;
      }
    }
  }

  .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    width: 100%;
    height: auto;
    padding: 0 16px;

    @include media-min($md) {
      flex-direction: column;
      height: 100%;
      padding: 24px 0;
    }
  }

  .main,
  .actions {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 100%;

    @include media-min($md) {
      flex-direction: column;
      gap: 8px;
    }
  }

  .main {
    width: 100%;
    height: auto;
    margin-left: -7px;

    @include media-min($md) {
      width: auto;
      height: 100%;
      margin-left: 0;
    }
  }

  .actions {
    display: flex;
    gap: 8px;
    height: auto;
    margin-left: 0;
  }

  .bottomContainer {
    position: relative;
    width: 100%;
    height: 0;
  }

  .bottomSlot {
    position: absolute;
  }

  .logo {
    position: relative;

    display: flex;
    align-items: center;
    justify-content: center;

    width: 52px;
    height: 36px;
    margin: 0 8px 0 0;
    padding: 0 16px 0 0;
    border-right: 1px solid var(--color-border);
    border-bottom: 0;

    @include media-min($md) {
      width: 44px;
      height: 60px;
      margin: 0 0 8px 0;
      padding: 0 0 12px 0;
      border-right: 0;
      border-bottom: 1px solid var(--color-border);
    }
  }

  .socials {
    display: none;

    @include media-min($md) {
      display: block;
      margin-bottom: 24px;
    }

    .ui-social-button {
      display: flex;
      justify-content: center;

      width: 40px;
      height: 40px;
      margin: 8px 0 8px 0;
      padding: 0;
      border-radius: 8px;

      opacity: 70%;

      &.is-discord {
        color: var(--color-text);

        &:hover {
          background-color: var(--color-discord-hover);
        }
      }

      &.is-boosty {
        color: var(--color-text);

        &:hover {
          background-color: var(--color-boosty-hover);
        }
      }

      &.is-vk {
        color: var(--color-text);

        &:hover {
          background-color: var(--color-vk-hover);
        }
      }

      &:hover {
        opacity: 100%;
      }
    }
  }
</style>
