<script setup lang="ts">
  import { useUserStore } from '~/shared/stores';
  import { AuthModal } from '~user/auth-modal';
  import { Breakpoint } from '~/composables/useBreakpoints';
  import type { DropdownMenuItem } from '@nuxt/ui';
  import KbdShortcut from './KbdShortcut.vue';

  const userStore = useUserStore();
  const { isAdmin } = useUserRoles();
  const { greaterOrEqual } = useBreakpoints();

  const { isLoggedIn, isLoading, user } = storeToRefs(userStore);

  const isAuthOpened = ref(false);
  const isMenuOpened = ref(false);

  const side = computed(() =>
    greaterOrEqual(Breakpoint.MD).value ? 'right' : 'top',
  );

  try {
    await userStore.fetch();
  } catch (err) {
    console.error(err);
  }

  // Инициалы пользователя
  const userInitials = computed(() => {
    if (!user.value?.username) return 'U';

    const parts = user.value.username.split(' ');

    if (parts.length >= 2) {
      const first = parts[0]?.[0];
      const second = parts[1]?.[0];

      if (first && second) return (first + second).toUpperCase();
    }

    const username = user.value.username;

    return username && username.length >= 2
      ? username.substring(0, 2).toUpperCase()
      : 'U';
  });

  function onClick() {
    isAuthOpened.value = true;
  }

  function logout() {
    userStore.logout().finally(() => {
      window.location.reload();
    });
  }

  function closeMenu() {
    isMenuOpened.value = false;
  }

  // Извлекает шорткаты из menuItems для defineShortcuts
  function extractShortcuts(
    items: DropdownMenuItem[][],
  ): Record<string, () => void> {
    const shortcuts: Record<string, () => void> = {};

    for (const group of items) {
      for (const item of group) {
        if (item.kbds && item.onSelect) {
          const kbdsArray = Array.isArray(item.kbds)
            ? item.kbds.filter((k): k is string => typeof k === 'string')
            : [];

          if (kbdsArray.length > 0) {
            const key = kbdsArray.join('_');

            shortcuts[key] = () => {
              item.onSelect?.(undefined as any);
            };
          }
        }
      }
    }

    return shortcuts;
  }

  // Определяем структуру меню (аналогично DropdownMenu, но используем вручную)
  const menuItems = computed<DropdownMenuItem[][]>(() => [
    // Основные пункты навигации
    [
      {
        label: 'Настройка профиля',
        icon: 'i-ttg-settings',
        onSelect: (e?: Event) => {
          e?.preventDefault();
          closeMenu();
          navigateTo({ name: 'user-profile' });
        },
      },
      ...(isAdmin.value
        ? [
            {
              label: 'Мастерская',
              icon: 'i-ttg-menu-filled-workshop',
              kbds: ['meta', 'shift', 'm'] as string[], // ← вот здесь шорткат
              onSelect: (e?: Event) => {
                e?.preventDefault();
                closeMenu();
                navigateTo({ name: 'workshop' });
              },
            },
          ]
        : []),
    ],
    // Пункт выхода
    [
      {
        label: 'Выход',
        icon: 'i-ttg-logout',
        color: 'error' as const,
        onSelect: logout,
      },
    ],
  ]);

  // Регистрируем глобальные шорткаты на основе kbds из menuItems
  watch(
    menuItems,
    (items) => {
      const shortcuts = extractShortcuts(items);

      if (Object.keys(shortcuts).length > 0) {
        defineShortcuts(shortcuts);
      }
    },
    { immediate: true },
  );
</script>

<template>
  <template v-if="!isLoggedIn">
    <UButton
      :loading="isLoading"
      variant="ghost"
      icon="i-ttg-profile-helmet-outline"
      size="xl"
      color="neutral"
      @click.left.exact.prevent="onClick"
    />

    <AuthModal v-model="isAuthOpened" />
  </template>

  <UPopover
    v-else
    v-model:open="isMenuOpened"
    :content="{ side }"
    :ui="{ content: 'w-80 p-0' }"
  >
    <template #default>
      <UButton
        :loading="isLoading"
        variant="ghost"
        icon="i-ttg-profile-helmet-filled"
        size="xl"
        color="neutral"
      />
    </template>

    <template #content>
      <div class="flex flex-col">
        <!-- Заголовок с именем и аватаром -->
        <div class="flex min-h-20 items-center gap-3 p-4">
          <div class="flex min-w-0 flex-1 flex-col">
            <div
              class="mb-1 overflow-hidden text-2xl font-semibold text-ellipsis whitespace-nowrap"
            >
              {{ user?.username || 'Пользователь' }}
            </div>

            <div
              class="overflow-hidden text-xs text-ellipsis whitespace-nowrap text-secondary"
            >
              {{ user?.email || '' }}
            </div>
          </div>

          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-(--color-primary-500) text-sm font-semibold text-(--ui-text-inverted)"
          >
            {{ userInitials }}
          </div>
        </div>

        <!-- Статистика -->
        <div class="-mt-2 px-4 pb-3">
          <USeparator class="mb-2">
            <span class="text-sm font-medium">Статистика</span>
          </USeparator>

          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between text-sm">
              <span>Скоро будет</span>

              <span class="text-sm font-semibold">∞</span>
            </div>

            <div class="flex items-center justify-between text-sm">
              <span>Скоро будет</span>

              <span class="text-sm font-semibold">∞</span>
            </div>
          </div>
        </div>

        <USeparator />

        <!-- Навигация — рендерим из menuItems -->
        <div class="flex flex-col py-1">
          <template
            v-for="(group, i) in menuItems"
            :key="i"
          >
            <div
              v-for="item in group"
              :key="item.label"
              class="p-1"
            >
              <UButton
                variant="ghost"
                :color="item.color"
                class="w-full justify-between px-2 py-2 text-default"
                @click="item.onSelect"
              >
                <div class="flex items-center">
                  <UIcon
                    :name="item.icon"
                    class="mr-2 size-5"
                  />

                  <span>{{ item.label }}</span>
                </div>

                <KbdShortcut :kbds="item.kbds" />
              </UButton>
            </div>

            <!-- Разделитель между группами, кроме последнего -->
            <USeparator v-if="i < menuItems.length - 1" />
          </template>
        </div>

        <!-- Выход уже в menuItems, но если хочешь отдельно — можно оставить -->
      </div>
    </template>
  </UPopover>
</template>
