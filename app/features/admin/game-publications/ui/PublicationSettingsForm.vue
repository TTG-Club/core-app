<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui';

  import type { PublicationSettingsForm } from '../model';

  import {
    PUBLICATION_SCHEDULE_ERROR_PATTERN,
    PUBLICATION_TEXT,
    publicationSettingsFormSchema,
  } from '../model';
  import PublicationScheduleEditor from './PublicationScheduleEditor.vue';

  const props = defineProps<{
    settings: PublicationSettingsForm;
    disabled: boolean;
  }>();

  const emit = defineEmits<{
    save: [settings: PublicationSettingsForm];
    cancel: [];
  }>();

  const formId = useId();

  const form = reactive({
    ...props.settings,
    schedule: props.settings.schedule.map((slot) => ({ ...slot })),
  });

  /** Передаёт только прошедшие валидацию настройки. */
  function submit(event: FormSubmitEvent<PublicationSettingsForm>): void {
    emit('save', event.data);
  }

  /** Показывает первое поле, которое помешало сохранению. */
  function focusInvalidField(): Promise<void> {
    return focusInvalidFormField(formId);
  }
</script>

<template>
  <UForm
    :id="formId"
    :aria-label="PUBLICATION_TEXT.global"
    :schema="publicationSettingsFormSchema"
    :state="form"
    :disabled="disabled"
    :loading-auto="false"
    class="space-y-5"
    @submit="submit"
    @error="focusInvalidField"
  >
    <USwitch
      v-model="form.enabled"
      :label="PUBLICATION_TEXT.enabled"
      :disabled="disabled"
    />

    <UFormField
      name="schedule"
      :error-pattern="PUBLICATION_SCHEDULE_ERROR_PATTERN"
      :description="PUBLICATION_TEXT.globalHint"
    >
      <PublicationScheduleEditor
        v-model="form.schedule"
        :disabled="disabled"
      />
    </UFormField>

    <div class="flex flex-wrap gap-2">
      <UButton
        type="submit"
        :disabled="disabled"
        >{{ PUBLICATION_TEXT.save }}</UButton
      >

      <UButton
        color="neutral"
        variant="ghost"
        :disabled="disabled"
        @click.left.exact.prevent="emit('cancel')"
        >{{ PUBLICATION_TEXT.cancel }}</UButton
      >
    </div>
  </UForm>
</template>
