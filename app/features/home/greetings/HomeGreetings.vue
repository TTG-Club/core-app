<script setup lang="ts">
  import type { HomeGreeting } from './model';

  import { v4 as createUuid } from 'uuid';

  import { USER_TOKEN_COOKIE } from '#shared/consts';
  import { MarkupRender } from '~ui/markup';

  import {
    GUEST_ID_HEADER,
    GUEST_ID_STORAGE_KEY,
    HOME_GREETING_API_URL,
    parseHomeGreeting,
  } from './model';

  const { isLoggedIn } = useUser();
  const userTokenCookie = useCookie<string | null>(USER_TOKEN_COOKIE);

  const guestId = useLocalStorage(GUEST_ID_STORAGE_KEY, '', {
    initOnMounted: true,
    writeDefaults: false,
  });

  const greeting = shallowRef<HomeGreeting | null>(null);
  const isGuest = computed(() => !isLoggedIn.value && !userTokenCookie.value);

  const guestHeaders = computed<Record<string, string> | undefined>(() => {
    if (!isGuest.value || !guestId.value) {
      return undefined;
    }

    return {
      [GUEST_ID_HEADER]: guestId.value,
    };
  });

  /**
   * Загружает приветствие и валидирует ответ API перед отрисовкой.
   */
  async function fetchHomeGreeting(): Promise<void> {
    const response = await $fetch<unknown>(HOME_GREETING_API_URL, {
      headers: guestHeaders.value,
    });

    greeting.value = parseHomeGreeting(response);
  }

  onMounted(() => {
    if (isGuest.value && !guestId.value) {
      guestId.value = createUuid();
    }

    void fetchHomeGreeting();
  });
</script>

<template>
  <div
    v-if="greeting"
    class="flex w-10/12 items-center justify-center"
  >
    <div
      :class="[
        'relative flex items-center justify-center',
        'w-100 px-5 py-6 max-sm:p-2',
        'rounded-xl border border-blue-500',
        'bg-(--color-message) shadow-md',
        'font-semibold text-black max-sm:text-xs',
        $style.message,
      ]"
    >
      <span class="text-center">
        <MarkupRender :render-node="greeting.text" />
      </span>
    </div>

    <img
      :src="greeting.image"
      :alt="greeting.persona"
      class="h-45 w-50 shrink-0 self-end object-contain object-bottom max-sm:h-30 max-sm:w-30"
    />
  </div>
</template>

<style module lang="scss">
  .message {
    &:after {
      content: '';

      position: absolute;
      top: 30%;
      right: -10px;
      transform: translateY(-50%);

      width: 0;
      height: 0;
      border-top: 10px solid transparent;
      border-bottom: 10px solid transparent;
      border-left: 10px solid var(--color-blue-500); /* Цвет фона */
    }
  }
</style>
