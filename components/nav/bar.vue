<script setup lang="ts">
  const { theme, change } = useTheme();

  const isAuthOpened = ref(false);
</script>

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

        <AButton
          type="text"
          size="large"
          @click.left.exact.prevent="isAuthOpened = true"
        >
          <template #icon>
            <SvgIcon name="profile/helmet/outline" />
          </template>
        </AButton>

        <ATooltip placement="right">
          <template #default>
            <AButton
              type="text"
              size="large"
              @click.left.exact.prevent="change"
            >
              <template #icon>
                <SvgIcon :name="`theme/${theme}`" />
              </template>
            </AButton>
          </template>

          <template #title> Переключить тему сайта </template>
        </ATooltip>
      </div>
    </header>
  </div>

  <AuthModal v-model="isAuthOpened" />
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
      height: 100%;
      min-height: 100%;
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
