<script setup lang="ts">
  import { SvgLogo } from '~ui/icon';
  import { SignIn } from '~user/auth-modal/ui';

  import { useMaintenanceGate } from '../composables';
  import {
    MAINTENANCE_FORBIDDEN_ICON,
    MAINTENANCE_FORBIDDEN_MESSAGE,
    MAINTENANCE_FORBIDDEN_TITLE,
    MAINTENANCE_ROBOTS_RULE,
    MAINTENANCE_SIGN_IN_HINT,
    MAINTENANCE_SIGN_IN_HINT_ICON,
    MAINTENANCE_SIGN_OUT_ICON,
    MAINTENANCE_SIGN_OUT_LABEL,
  } from '../model';

  const { gate, refresh, setSignedIn } = useMaintenanceGate();
  const { logout } = useUser();

  const isSigningOut = ref(false);

  // Заголовок X-Robots-Tag ставит сервер (плагин maintenanceResponse), здесь —
  // мета: иначе модуль robots оставил бы правило страницы «индексировать».
  useSeoMeta({
    title: () => gate.value.title,
    robots: MAINTENANCE_ROBOTS_RULE,
  });

  /**
   * После входа сервер решает заново: кого пускают (администратора или роль из
   * настройки), тому страница перезагружается — сервер откроет сайт. Остальные
   * остаются вошедшими (выйти можно кнопкой), но вместо формы видят отказ:
   * разлогинивать молча было бы неожиданно.
   */
  async function handleSignedIn(): Promise<void> {
    await refresh();

    if (!gate.value.blocked) {
      reloadNuxtApp({ force: true });

      return;
    }

    setSignedIn(true);
  }

  /** Выход: заглушка снова показывает форму входа. */
  async function handleSignOut(): Promise<void> {
    isSigningOut.value = true;

    try {
      await logout();
      setSignedIn(false);
    } finally {
      isSigningOut.value = false;
    }
  }
</script>

<template>
  <main class="flex min-h-dvh w-full items-center justify-center px-4 py-10">
    <div class="flex w-full max-w-md flex-col items-center gap-6">
      <!-- Логотип тянется на 100% родителя, размер задаёт обёртка -->
      <div class="size-32 sm:size-40">
        <SvgLogo />
      </div>

      <div class="flex flex-col gap-3 text-center">
        <h1
          class="text-2xl font-semibold text-balance text-highlighted sm:text-3xl"
        >
          {{ gate.title }}
        </h1>

        <p class="whitespace-pre-line text-default">
          {{ gate.message }}
        </p>
      </div>

      <UCard
        class="w-full"
        variant="subtle"
      >
        <div
          v-if="gate.signedIn"
          class="flex flex-col items-center gap-3 text-center"
        >
          <UIcon
            :name="MAINTENANCE_FORBIDDEN_ICON"
            class="size-10 text-warning"
          />

          <h2 class="text-lg font-semibold text-highlighted">
            {{ MAINTENANCE_FORBIDDEN_TITLE }}
          </h2>

          <p class="text-sm text-muted">
            {{ MAINTENANCE_FORBIDDEN_MESSAGE }}
          </p>

          <UButton
            color="neutral"
            variant="subtle"
            :icon="MAINTENANCE_SIGN_OUT_ICON"
            :loading="isSigningOut"
            @click.left.exact.prevent="handleSignOut"
          >
            {{ MAINTENANCE_SIGN_OUT_LABEL }}
          </UButton>
        </div>

        <div
          v-else
          class="flex flex-col gap-5"
        >
          <SignIn
            sign-in-only
            @close="handleSignedIn"
          />

          <p
            class="flex items-start gap-2 border-t border-default pt-4 text-sm text-muted"
          >
            <UIcon
              :name="MAINTENANCE_SIGN_IN_HINT_ICON"
              class="mt-0.5 size-4 shrink-0"
            />

            {{ MAINTENANCE_SIGN_IN_HINT }}
          </p>
        </div>
      </UCard>
    </div>
  </main>
</template>
