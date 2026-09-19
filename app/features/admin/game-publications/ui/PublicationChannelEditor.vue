<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui';

  import type { PublicationChannel, PublicationChannelForm } from '../model';

  import {
    PUBLICATION_DEFAULT_PLATFORM,
    PUBLICATION_DEFAULT_SLOT,
    PUBLICATION_INITIAL_REVISION,
    PUBLICATION_PLATFORM_OPTIONS,
    PUBLICATION_PLATFORMS,
    PUBLICATION_SCHEDULE_ERROR_PATTERN,
    PUBLICATION_TELEGRAM_ID_VISIBILITY,
    PUBLICATION_TEXT,
    publicationChannelFormSchema,
  } from '../model';
  import PublicationScheduleEditor from './PublicationScheduleEditor.vue';

  const props = defineProps<{
    channel: PublicationChannel | null;
    busy: boolean;
  }>();

  const emit = defineEmits<{
    save: [form: PublicationChannelForm];
    cancel: [];
  }>();

  const formId = useId();
  const [telegramChatIdVisible, toggleTelegramChatId] = useToggle(false);

  const telegramChatIdVisibility = computed(() =>
    telegramChatIdVisible.value
      ? PUBLICATION_TELEGRAM_ID_VISIBILITY.visible
      : PUBLICATION_TELEGRAM_ID_VISIBILITY.hidden,
  );

  const form = reactive<PublicationChannelForm>({
    name: props.channel?.name ?? '',
    platform: props.channel?.platform ?? PUBLICATION_DEFAULT_PLATFORM,
    telegramChatId: '',
    enabled: props.channel?.enabled ?? true,
    webhookUrl: '',
    inherit: props.channel?.schedule == null,
    schedule: props.channel?.schedule?.map((slot) => ({ ...slot })) ?? [
      { ...PUBLICATION_DEFAULT_SLOT },
    ],
    revision: props.channel?.revision ?? PUBLICATION_INITIAL_REVISION,
    isNew: props.channel === null,
  });

  const webhookDescription = computed(() =>
    props.channel
      ? PUBLICATION_TEXT.webhookSaved
      : PUBLICATION_TEXT.webhookHint,
  );

  const hasOverride = computed(() => !form.inherit);

  const isTelegram = computed(
    () => form.platform === PUBLICATION_PLATFORMS.TELEGRAM.value,
  );

  const platformDisabled = computed(() => props.busy || !form.isNew);

  const telegramDescription = computed(() =>
    props.channel
      ? PUBLICATION_TEXT.telegramSaved
      : PUBLICATION_TEXT.telegramHint,
  );

  watch(
    () => form.platform,
    () => {
      form.webhookUrl = '';
      form.telegramChatId = '';
      telegramChatIdVisible.value = false;
    },
    { flush: 'sync' },
  );

  /** Передаёт валидную форму без сохранения адреса канала в общем состоянии приложения. */
  function submit(event: FormSubmitEvent<PublicationChannelForm>): void {
    emit('save', event.data);
  }

  /** Показывает первое поле, которое помешало сохранению. */
  function focusInvalidField(): Promise<void> {
    return focusInvalidFormField(formId);
  }

  /** Закрывает форму и удаляет введённый секрет из её состояния. */
  function cancel(): void {
    form.webhookUrl = '';
    form.telegramChatId = '';
    emit('cancel');
  }

  onBeforeUnmount(() => {
    form.webhookUrl = '';
    form.telegramChatId = '';
  });
</script>

<template>
  <UForm
    :id="formId"
    :aria-label="PUBLICATION_TEXT.channelSettings"
    :schema="publicationChannelFormSchema"
    :state="form"
    :disabled="busy"
    :loading-auto="false"
    class="space-y-5"
    @submit="submit"
    @error="focusInvalidField"
  >
    <UFormField
      name="platform"
      :label="PUBLICATION_TEXT.platform"
      required
    >
      <USelect
        v-model="form.platform"
        :items="PUBLICATION_PLATFORM_OPTIONS"
        :disabled="platformDisabled"
        class="w-full"
      />
    </UFormField>

    <UFormField
      name="name"
      :label="PUBLICATION_TEXT.name"
      required
    >
      <UInput
        v-model="form.name"
        autocomplete="off"
        class="w-full"
        :disabled="busy"
      />
    </UFormField>

    <UFormField
      v-if="isTelegram"
      name="telegramChatId"
      :label="PUBLICATION_TEXT.telegramChatId"
      :description="telegramDescription"
      :required="form.isNew"
    >
      <UInput
        v-model="form.telegramChatId"
        :type="telegramChatIdVisibility.type"
        autocomplete="new-password"
        :spellcheck="false"
        :placeholder="PUBLICATION_TEXT.telegramChatIdPlaceholder"
        :disabled="busy"
        :ui="{ trailing: 'pe-1' }"
        class="w-full"
      >
        <template #trailing>
          <UButton
            type="button"
            color="neutral"
            variant="link"
            size="sm"
            :icon="telegramChatIdVisibility.icon"
            :aria-label="telegramChatIdVisibility.label"
            :title="telegramChatIdVisibility.label"
            :aria-pressed="telegramChatIdVisible"
            :disabled="busy"
            @click.left.exact.prevent="toggleTelegramChatId()"
          />
        </template>
      </UInput>
    </UFormField>

    <UFormField
      v-else
      name="webhookUrl"
      :label="PUBLICATION_TEXT.webhook"
      :description="webhookDescription"
      :required="form.isNew"
    >
      <UInput
        v-model="form.webhookUrl"
        type="password"
        autocomplete="new-password"
        :spellcheck="false"
        class="w-full"
        :disabled="busy"
      />
    </UFormField>

    <USwitch
      v-model="form.enabled"
      :label="PUBLICATION_TEXT.channelEnabled"
      :disabled="busy"
    />

    <USwitch
      v-model="form.inherit"
      :label="PUBLICATION_TEXT.inherit"
      :description="PUBLICATION_TEXT.override"
      :disabled="busy"
    />

    <UFormField
      v-if="hasOverride"
      name="schedule"
      :error-pattern="PUBLICATION_SCHEDULE_ERROR_PATTERN"
    >
      <PublicationScheduleEditor
        v-model="form.schedule"
        :disabled="busy"
      />
    </UFormField>

    <div class="flex flex-wrap gap-2">
      <UButton
        type="submit"
        :loading="busy"
        >{{ PUBLICATION_TEXT.save }}</UButton
      >

      <UButton
        color="neutral"
        variant="ghost"
        :disabled="busy"
        @click.left.exact.prevent="cancel"
        >{{ PUBLICATION_TEXT.cancel }}</UButton
      >
    </div>
  </UForm>
</template>
