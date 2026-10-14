<script setup lang="ts">
  import type { VttgAuthorizeRequest } from '../model';

  import { VTTG_AUTHORIZE_ICONS, VTTG_AUTHORIZE_TEXT } from '../model';

  const { accountName = '' } = defineProps<{
    /** Запрос входа из ссылки мира */
    request: VttgAuthorizeRequest;
    /** Выполнен ли вход на сайте */
    hasSession: boolean;
    /** Ник аккаунта; пуст, пока профиль загружается */
    accountName?: string;
    /** Идёт выдача справки */
    isAllowing: boolean;
  }>();

  defineSlots<{
    /** Место под сообщение об ошибке — над кнопками */
    default?: () => unknown;
  }>();

  const emit = defineEmits<{
    'allow': [];
    'cancel': [];
    'sign-in': [];
  }>();

  /** Ник либо подпись ожидания, пока профиль не загружен. */
  const accountLabel = computed(
    () => accountName || VTTG_AUTHORIZE_TEXT.accountPending,
  );
</script>

<template>
  <UCard
    class="w-full max-w-xl"
    :ui="{ body: 'flex flex-col gap-5' }"
  >
    <h2 class="text-lg font-medium text-highlighted">
      {{ VTTG_AUTHORIZE_TEXT.question }}
    </h2>

    <dl class="flex flex-col gap-3 rounded-lg bg-elevated p-4">
      <div class="flex items-start gap-3">
        <UIcon
          :name="VTTG_AUTHORIZE_ICONS.world"
          class="mt-0.5 size-5 shrink-0 text-dimmed"
        />

        <div class="flex min-w-0 flex-col gap-2">
          <div class="flex min-w-0 flex-col">
            <dt class="text-xs text-muted">
              {{ VTTG_AUTHORIZE_TEXT.worldAddressLabel }}
            </dt>

            <!-- Адрес — то, чему человек доверяет: крупно и без обрезки. -->
            <dd class="text-base font-medium break-all text-highlighted">
              {{ request.worldOrigin }}
            </dd>
          </div>

          <div
            v-if="request.worldName"
            class="flex min-w-0 flex-col"
          >
            <dt class="text-xs text-muted">
              {{ VTTG_AUTHORIZE_TEXT.worldNameLabel }}
            </dt>

            <dd class="text-sm wrap-break-word text-toned">
              {{ request.worldName }}
            </dd>
          </div>
        </div>
      </div>

      <div
        v-if="hasSession"
        class="flex items-start gap-3"
      >
        <UIcon
          :name="VTTG_AUTHORIZE_ICONS.account"
          class="mt-0.5 size-5 shrink-0 text-dimmed"
        />

        <div class="flex min-w-0 flex-col">
          <dt class="text-xs text-muted">
            {{ VTTG_AUTHORIZE_TEXT.accountLabel }}
          </dt>

          <dd class="text-base font-medium wrap-break-word text-highlighted">
            {{ accountLabel }}
          </dd>
        </div>
      </div>
    </dl>

    <UAlert
      :title="VTTG_AUTHORIZE_TEXT.sharedTitle"
      :description="VTTG_AUTHORIZE_TEXT.sharedDescription"
      :icon="VTTG_AUTHORIZE_ICONS.shared"
      color="success"
      variant="subtle"
    />

    <UAlert
      :title="VTTG_AUTHORIZE_TEXT.warningTitle"
      :description="VTTG_AUTHORIZE_TEXT.warningDescription"
      :icon="VTTG_AUTHORIZE_ICONS.warning"
      color="warning"
      variant="subtle"
    />

    <slot />

    <div
      v-if="hasSession"
      class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
    >
      <UButton
        :label="VTTG_AUTHORIZE_TEXT.cancelLabel"
        color="neutral"
        variant="ghost"
        size="lg"
        class="justify-center"
        :disabled="isAllowing"
        @click.left.exact.prevent="emit('cancel')"
      />

      <UButton
        :label="VTTG_AUTHORIZE_TEXT.allowLabel"
        :icon="VTTG_AUTHORIZE_ICONS.allow"
        size="lg"
        class="justify-center"
        :loading="isAllowing"
        @click.left.exact.prevent="emit('allow')"
      />
    </div>

    <div
      v-else
      class="flex flex-col gap-3"
    >
      <p class="text-sm leading-6 text-toned">
        {{ VTTG_AUTHORIZE_TEXT.signInPrompt }}
      </p>

      <UButton
        :label="VTTG_AUTHORIZE_TEXT.signInLabel"
        :icon="VTTG_AUTHORIZE_ICONS.signIn"
        size="lg"
        block
        @click.left.exact.prevent="emit('sign-in')"
      />
    </div>
  </UCard>
</template>
