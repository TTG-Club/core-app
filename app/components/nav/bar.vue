<template>
  <div :class="$style.navbar">
    <header :class="$style.header">
      <div :class="$style.main">
        <NuxtLink
          :to="{ name: 'index' }"
          :class="$style.logo"
        >
          <SvgLogo />
        </NuxtLink>
      </div>

      <div :class="$style.actions">
        <div :class="$style.socials" />

        <NavButtonUser />

        <NavButtonTheme />
      </div>
    </header>
  </div>
</template>

<style lang="scss" module>
  .navbar {
    --navbar-height: calc(56px + var(--safe-area-inset-bottom));
    --navbar-width: calc(56px + var(--safe-area-inset-left));

    position: relative;
    z-index: 100;

    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;

    width: 100%;
    height: var(--navbar-height);
    min-height: 56px;
    padding-bottom: var(--safe-area-inset-bottom);

    background-color: var(--color-bg-main);
    border-top: 1px solid var(--color-border);
    border-right: 0;

    @include media-min($md) {
      flex-direction: column;
      flex-wrap: nowrap;

      width: calc(var(--navbar-width) + 8px);
      min-width: calc(var(--navbar-width) + 8px);
      height: 100vh;
      min-height: 100vh;
      padding-bottom: 0;
      padding-left: var(--safe-area-inset-left);

      border-top: 0;
      border-right: 1px solid var(--color-border);
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
    flex-direction: column;
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

    border-right: 1px solid var(--border);
    border-bottom: 0;

    @include media-min($md) {
      width: 44px;
      height: 60px;
      margin: 0 0 8px 0;
      padding: 0 0 24px 0;

      border-right: 0;
      border-bottom: 1px solid var(--border);
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

      opacity: 70%;
      border-radius: 8px;

      &.is-discord {
        color: var(--text-btn-color);

        &:hover {
          background-color: var(--discord-hover);
        }
      }

      &.is-boosty {
        color: var(--text-btn-color);

        &:hover {
          background-color: var(--boosty-hover);
        }
      }

      &.is-vk {
        color: var(--text-btn-color);

        &:hover {
          background-color: var(--vk-hover);
        }
      }

      &:hover {
        opacity: 100%;
      }
    }
  }
</style>
