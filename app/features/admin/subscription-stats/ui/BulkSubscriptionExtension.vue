<script setup lang="ts">
  import { useBulkSubscriptionExtension } from '../composables';
  import {
    BULK_EXTENSION_CANCEL_LABEL,
    BULK_EXTENSION_CONFIRM_LABEL,
    BULK_EXTENSION_CONFIRM_TITLE,
    BULK_EXTENSION_CONFIRM_WARNING,
    BULK_EXTENSION_DATE_FORMAT,
    BULK_EXTENSION_DAYS_DEFAULT,
    BULK_EXTENSION_DAYS_LABEL,
    BULK_EXTENSION_DAYS_MAX,
    BULK_EXTENSION_DAYS_MIN,
    BULK_EXTENSION_DESCRIPTION,
    BULK_EXTENSION_ICON,
    BULK_EXTENSION_JOURNAL_EMPTY_TEXT,
    BULK_EXTENSION_JOURNAL_ERROR_TEXT,
    BULK_EXTENSION_JOURNAL_TITLE,
    BULK_EXTENSION_SUBMIT_LABEL,
    formatBulkExtensionDetails,
    formatBulkExtensionSummary,
    getBulkExtensionConfirmText,
  } from '../model';
  import SubscriptionStatsList from './SubscriptionStatsList.vue';

  const props = defineProps<{
    /** Сколько пользователей сейчас с подпиской — для подтверждения. */
    activeSubscribers: number;
    isSubscribersPending: boolean;
  }>();

  const emit = defineEmits<{
    /** Продление прошло: странице пора перечитать подписки. */
    extended: [];
  }>();

  const { format } = useDayjs();

  const {
    extensions,
    isExtensionsPending,
    hasExtensionsError,
    isExtending,
    startOperation,
    extend,
  } = useBulkSubscriptionExtension();

  const days = ref(BULK_EXTENSION_DAYS_DEFAULT);

  const isDialogOpen = ref(false);

  const isDaysValid = computed(
    () =>
      Number.isInteger(days.value)
      && days.value >= BULK_EXTENSION_DAYS_MIN
      && days.value <= BULK_EXTENSION_DAYS_MAX,
  );

  const isSubmitDisabled = computed(
    () =>
      !isDaysValid.value
      || props.isSubscribersPending
      || props.activeSubscribers === 0,
  );

  const dialogDescription = computed(() =>
    getBulkExtensionConfirmText(props.activeSubscribers, days.value),
  );

  const journalErrorText = computed(() =>
    hasExtensionsError.value ? BULK_EXTENSION_JOURNAL_ERROR_TEXT : undefined,
  );

  const isJournalEmpty = computed(() => !extensions.value.length);

  const journalRows = computed(() =>
    extensions.value.map((extension) => ({
      id: extension.id,
      summary: formatBulkExtensionSummary(extension),
      details: formatBulkExtensionDetails(
        format(extension.createdAt, BULK_EXTENSION_DATE_FORMAT),
        extension.actorUsername,
      ),
    })),
  );

  /** Открывает подтверждение с новой операцией продления. */
  function openDialog(): void {
    startOperation();
    isDialogOpen.value = true;
  }

  /** Закрывает подтверждение без продления. */
  function closeDialog(): void {
    isDialogOpen.value = false;
  }

  /** Продлевает подписку всем и при успехе закрывает подтверждение. */
  async function onConfirm(): Promise<void> {
    if (!(await extend(days.value))) {
      return;
    }

    isDialogOpen.value = false;
    emit('extended');
  }
</script>

<template>
  <div>
    <div class="space-y-3 px-4 py-3">
      <p class="text-sm text-muted">
        {{ BULK_EXTENSION_DESCRIPTION }}
      </p>

      <div class="flex flex-wrap items-end gap-2">
        <UFormField
          :label="BULK_EXTENSION_DAYS_LABEL"
          class="w-32"
        >
          <UInputNumber
            v-model="days"
            :min="BULK_EXTENSION_DAYS_MIN"
            :max="BULK_EXTENSION_DAYS_MAX"
            :disabled="isExtending"
            class="w-full"
          />
        </UFormField>

        <UButton
          :icon="BULK_EXTENSION_ICON"
          color="primary"
          :disabled="isSubmitDisabled"
          :loading="isExtending"
          @click.left.exact.prevent="openDialog"
        >
          {{ BULK_EXTENSION_SUBMIT_LABEL }}
        </UButton>
      </div>
    </div>

    <div class="border-t border-default">
      <h4 class="px-4 pt-3 text-xs font-medium text-muted">
        {{ BULK_EXTENSION_JOURNAL_TITLE }}
      </h4>

      <SubscriptionStatsList
        :is-pending="isExtensionsPending"
        :is-empty="isJournalEmpty"
        :empty-text="BULK_EXTENSION_JOURNAL_EMPTY_TEXT"
        :error-text="journalErrorText"
      >
        <li
          v-for="row in journalRows"
          :key="row.id"
          class="flex flex-wrap items-baseline justify-between gap-x-3 px-4 py-2.5 text-sm"
        >
          <span class="text-highlighted">{{ row.summary }}</span>

          <span class="text-xs text-muted">{{ row.details }}</span>
        </li>
      </SubscriptionStatsList>
    </div>

    <UModal
      v-model:open="isDialogOpen"
      :title="BULK_EXTENSION_CONFIRM_TITLE"
      :description="dialogDescription"
      :dismissible="!isExtending"
    >
      <template #body>
        <p class="text-sm text-warning">
          {{ BULK_EXTENSION_CONFIRM_WARNING }}
        </p>
      </template>

      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="isExtending"
            @click.left.exact.prevent="closeDialog"
          >
            {{ BULK_EXTENSION_CANCEL_LABEL }}
          </UButton>

          <UButton
            :icon="BULK_EXTENSION_ICON"
            color="primary"
            :loading="isExtending"
            @click.left.exact.prevent="onConfirm"
          >
            {{ BULK_EXTENSION_CONFIRM_LABEL }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
