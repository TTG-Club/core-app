<script setup lang="ts">
  import { AppMenu } from '~sidebar/menu';
  import { ThemeSwitcher } from '~sidebar/theme-switcher';
  import { UserHelmet } from '~user/helmet';
  import { SvgLogo } from '~ui/icon';
  import { SearchButton } from '~search/button';
  import { useGlobalSearch } from '~search/composable';

  const route = useRoute();
  const { y } = useWindowScroll();
  const { height: windowHeight } = useWindowSize();

  const { height: bodyHeight } = useElementBounding(
    computed(() => document?.body),
  );

  const { smaller } = useBreakpoints();
  const { close } = useSidebarPopover();
  const { open } = useGlobalSearch();

  defineShortcuts({
    '/': open,
    '\\': open,
    'meta_k': open,
  });

  const isMobile = smaller(Breakpoint.MD);
  const hidden = useState('navbar-hidden', () => false);

  watchThrottled(
    [y, windowHeight, bodyHeight],
    ([scroll, currentWindowHeight, currentBodyHeight], [oldScroll]) => {
      if (!isMobile.value) {
        return;
      }

      if (scroll < 56) {
        if (hidden.value) {
          hidden.value = false;
        }

        return;
      }

      if (scroll + currentWindowHeight >= currentBodyHeight - 56) {
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
  <div
    class="navbar"
    :class="[
      'fixed left-0 z-100 h-(--navbar-height) w-full md:top-0 md:bottom-auto md:h-dvh md:w-(--navbar-width)',
      'border-t border-default max-md:bg-default md:border-t-0 md:border-r',
      'pb-(--safe-area-inset-bottom) md:pb-0 md:pl-(--safe-area-inset-left)',
      'transition-[bottom] duration-200 ease-in-out md:transition-none',
      'flex flex-nowrap md:flex-col',
      hidden ? '-bottom-(--navbar-height)' : 'bottom-0',
    ]"
  >
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

          <SearchButton />
        </ClientOnly>
      </div>

      <div :class="$style.actions">
        <div :class="$style.socials" />

        <ClientOnly>
          <UserHelmet />

          <ThemeSwitcher />
        </ClientOnly>
      </div>
    </header>
  </div>
</template>

<style lang="scss" module>
  .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    width: 100%;
    height: 100%;
    padding: 0 16px;

    @include media-min($md) {
      flex-direction: column;
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
    border-right: 1px solid var(--ui-border);
    border-bottom: 0;

    @include media-min($md) {
      width: 44px;
      height: 60px;
      margin: 0 0 8px 0;
      padding: 0 0 12px 0;
      border-right: 0;
      border-bottom: 1px solid var(--ui-border);
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

      width: 44px;
      height: 44px;
      margin: 8px 0 8px 0;
      padding: 0;
      border-radius: 8px;

      opacity: 70%;

      &.is-discord {
        color: var(--ui-text);

        &:hover {
          background-color: var(--color-discord-hover);
        }
      }

      &.is-boosty {
        color: var(--ui-text);

        &:hover {
          background-color: var(--color-boosty-hover);
        }
      }

      &.is-vk {
        color: var(--ui-text);

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
