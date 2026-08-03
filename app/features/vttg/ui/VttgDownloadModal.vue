<script setup lang="ts">
  import { USER_TOKEN_COOKIE } from '#shared/consts';

  import { VTTG_DOWNLOAD_NOTICE } from '../model';

  const emit = defineEmits<{
    /**
     * `true` — гость попросил окно входа, его открывает вызывающая сторона.
     * Значения нет, когда окно закрыли крестиком или Escape.
     */
    close: [needsSignIn?: boolean];
  }>();

  // Сессию решает кука токена, а не профиль: профиль догружается лениво, и
  // залогиненный успел бы увидеть приглашение войти вместо ссылки в кабинет.
  const token = useCookie<string | null>(USER_TOKEN_COOKIE);

  const { isLoggedIn } = useUser();

  const hasSession = computed(() => isLoggedIn.value || Boolean(token.value));

  const hint = computed(() =>
    hasSession.value
      ? VTTG_DOWNLOAD_NOTICE.hint
      : VTTG_DOWNLOAD_NOTICE.guestHint,
  );

  /** Закрытие без просьбы о входе: сообщение прочитано. */
  function handleClose() {
    emit('close', false);
  }

  /** Гость идёт входить: окно закрывается, вход открывает первый экран. */
  function handleSignIn() {
    emit('close', true);
  }
</script>

<template>
  <UModal :title="VTTG_DOWNLOAD_NOTICE.title">
    <template #body>
      <div class="flex flex-col gap-3">
        <p
          v-for="paragraph in VTTG_DOWNLOAD_NOTICE.paragraphs"
          :key="paragraph"
          class="text-sm leading-relaxed text-toned"
        >
          {{ paragraph }}
        </p>

        <div
          class="flex items-start gap-2.5 rounded-lg border border-default bg-elevated/40 p-3"
        >
          <UIcon
            name="tabler:key"
            class="mt-0.5 size-5 shrink-0 text-primary"
            aria-hidden="true"
          />

          <p class="text-sm leading-relaxed text-muted">
            {{ hint }}
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap justify-end gap-2">
        <UButton
          :label="VTTG_DOWNLOAD_NOTICE.closeLabel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleClose"
        />

        <!-- Кнопка-ссылка: `prevent` тут запретил бы переход в кабинет. -->
        <UButton
          v-if="hasSession"
          v-bind="VTTG_DOWNLOAD_NOTICE.action"
          @click.left.exact="handleClose"
        />

        <UButton
          v-else
          v-bind="VTTG_DOWNLOAD_NOTICE.guestAction"
          @click.left.exact.prevent="handleSignIn"
        />
      </div>
    </template>
  </UModal>
</template>
