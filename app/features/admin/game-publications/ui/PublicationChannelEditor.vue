<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui';

  import type { PublicationChannel, PublicationChannelForm } from '../model';

  import { UploadImage } from '~ui/upload';

  import {
    PUBLICATION_DEFAULT_PLATFORM,
    PUBLICATION_DEFAULT_SLOT,
    PUBLICATION_ICONS,
    PUBLICATION_IMAGE_MAX_SIZE,
    PUBLICATION_IMAGE_SECTION,
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
    vkGroupConfigured: boolean;
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
    vkGroupId: '',
    vkGroupDefault: props.vkGroupConfigured,
    enabled: props.channel?.enabled ?? true,
    webhookUrl: '',
    inherit: props.channel?.schedule == null,
    schedule: props.channel?.schedule?.map((slot) => ({ ...slot })) ?? [
      { ...PUBLICATION_DEFAULT_SLOT },
    ],
    revision: props.channel?.revision ?? PUBLICATION_INITIAL_REVISION,
    isNew: props.channel === null,
    imageUrl: props.channel?.imageUrl ?? '',
  });

  const isImageUploading = ref(false);

  // Картинка лежит в хранилище того сайта, где её загрузили: у дева и боя они
  // разные. Локальный адрес сервису недоступен — тогда отдаём только путь.
  const { origin } = useRequestURL();
  const imageSite = origin.startsWith('https://') ? origin : '';

  // Загрузчик стирает прежний файл после новой загрузки. Сохранённую картинку
  // канала ему не отдаём: при отмене формы канал должен остаться с ней.
  const sessionImage = ref<string>();

  // Мост загрузчика и формы: загрузчик видит только файлы этой формы,
  // а в форму попадает последняя загруженная картинка.
  const uploadedImage = computed<string | undefined>({
    get: () => sessionImage.value,
    set: (imageUrl) => {
      sessionImage.value = imageUrl;
      form.imageUrl = imageUrl ? imageSite + imageUrl : '';
    },
  });

  const saveDisabled = computed(() => props.busy || isImageUploading.value);

  const webhookDescription = computed(() =>
    props.channel
      ? PUBLICATION_TEXT.webhookSaved
      : PUBLICATION_TEXT.webhookHint,
  );

  const hasOverride = computed(() => !form.inherit);

  const isTelegram = computed(
    () => form.platform === PUBLICATION_PLATFORMS.TELEGRAM.value,
  );

  const isVk = computed(() => form.platform === PUBLICATION_PLATFORMS.VK.value);

  const platformDisabled = computed(() => props.busy || !form.isNew);

  const telegramDescription = computed(() =>
    props.channel
      ? PUBLICATION_TEXT.telegramSaved
      : PUBLICATION_TEXT.telegramHint,
  );

  const vkDescription = computed(() => {
    if (props.channel) {
      return PUBLICATION_TEXT.vkSaved;
    }

    return form.vkGroupDefault
      ? PUBLICATION_TEXT.vkDefaultHint
      : PUBLICATION_TEXT.vkHint;
  });

  const vkGroupRequired = computed(() => form.isNew && !form.vkGroupDefault);

  watch(
    () => form.platform,
    () => {
      form.webhookUrl = '';
      form.telegramChatId = '';
      form.vkGroupId = '';
      telegramChatIdVisible.value = false;
    },
    { flush: 'sync' },
  );

  /** Передаёт валидную форму без сохранения адреса канала в общем состоянии приложения. */
  function submit(event: FormSubmitEvent<PublicationChannelForm>): void {
    // Без этой проверки канал сохранился бы без «догоняющей» картинки.
    if (isImageUploading.value) {
      return;
    }

    emit('save', event.data);
  }

  /** Убирает картинку у канала; файл в хранилище не удаляется: форму ещё можно отменить. */
  function removeImage(): void {
    form.imageUrl = '';
  }

  /** Показывает первое поле, которое помешало сохранению. */
  function focusInvalidField(): Promise<void> {
    return focusInvalidFormField(formId);
  }

  /** Закрывает форму и удаляет введённый секрет из её состояния. */
  function cancel(): void {
    form.webhookUrl = '';
    form.telegramChatId = '';
    form.vkGroupId = '';
    emit('cancel');
  }

  onBeforeUnmount(() => {
    form.webhookUrl = '';
    form.telegramChatId = '';
    form.vkGroupId = '';
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
      v-else-if="isVk"
      name="vkGroupId"
      :label="PUBLICATION_TEXT.vkGroupId"
      :description="vkDescription"
      :required="vkGroupRequired"
    >
      <UInput
        v-model="form.vkGroupId"
        inputmode="numeric"
        autocomplete="off"
        :spellcheck="false"
        :placeholder="PUBLICATION_TEXT.vkGroupIdPlaceholder"
        :disabled="busy"
        class="w-full"
      />
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

    <UFormField
      name="imageUrl"
      :label="PUBLICATION_TEXT.image"
      :description="PUBLICATION_TEXT.imageHint"
    >
      <UploadImage
        v-model="uploadedImage"
        v-model:uploading="isImageUploading"
        :section="PUBLICATION_IMAGE_SECTION"
        :max-size="PUBLICATION_IMAGE_MAX_SIZE"
      >
        <template
          v-if="form.imageUrl"
          #preview
        >
          <div class="flex flex-col items-start gap-2">
            <!-- Рамка 16:9 задана до загрузки, чтобы форма не прыгала;
              картинка другой формы вписывается в неё целиком -->
            <img
              :src="form.imageUrl"
              :alt="PUBLICATION_TEXT.image"
              decoding="async"
              class="aspect-video w-full max-w-sm rounded-lg border border-default bg-elevated object-contain"
            />

            <UButton
              color="neutral"
              variant="soft"
              size="sm"
              :icon="PUBLICATION_ICONS.remove"
              :disabled="saveDisabled"
              @click.left.exact.prevent="removeImage"
              >{{ PUBLICATION_TEXT.removeImage }}</UButton
            >
          </div>
        </template>
      </UploadImage>
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
        :disabled="saveDisabled"
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
