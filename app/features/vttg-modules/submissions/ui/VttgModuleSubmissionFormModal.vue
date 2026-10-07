<script setup lang="ts">
  import type { ModuleSubmission, SubmissionRequest } from '../../model';

  import { UiModalActions } from '~ui/modal-actions';

  import { useVttgGameSystems } from '../../composables';
  import {
    CANCEL_LABEL,
    createSubmissionForm,
    FORM_CREATE_TITLE,
    FORM_DESCRIPTION_LABEL,
    FORM_DESCRIPTION_PLACEHOLDER,
    FORM_EDIT_HINT,
    FORM_EDIT_TITLE,
    FORM_LINKS_LOCKED_HINT,
    FORM_MANIFEST_HINT,
    FORM_MANIFEST_LABEL,
    FORM_MANIFEST_PLACEHOLDER,
    FORM_RESUBMIT_LABEL,
    FORM_SUBMIT_ICON,
    FORM_SUBMIT_LABEL,
    FORM_SYSTEMS_HINT,
    FORM_SYSTEMS_LABEL,
    FORM_SYSTEMS_PLACEHOLDER,
    SUBMISSION_DESCRIPTION_MAX_LENGTH,
    SUBMISSION_URL_MAX_LENGTH,
    submissionRequestSchema,
    TEXTAREA_ROWS,
  } from '../../model';

  /**
   * Подача и правка заявки. Одно окно на оба случая: поля одни и те же, а
   * правка — это та же подача, только заявка уходит на рассмотрение заново.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { submission = null, loading = false } = defineProps<{
    /** Заявка для правки; `null` — новая заявка. */
    submission?: ModuleSubmission | null;
    loading?: boolean;
  }>();

  const emit = defineEmits<{
    submit: [request: SubmissionRequest];
  }>();

  const { systemItems, isLoading: areSystemsLoading } = useVttgGameSystems();

  const form = ref<SubmissionRequest>(createSubmissionForm(null));

  const isEdit = computed(() => submission !== null);

  const title = computed(() =>
    isEdit.value ? FORM_EDIT_TITLE : FORM_CREATE_TITLE,
  );

  const description = computed(() =>
    isEdit.value ? FORM_EDIT_HINT : undefined,
  );

  // Ссылка модуля, который уже одобрялся, фиксирована: сервис отклонит её
  // смену, поэтому поле закрыто, а подсказка ведёт к новой заявке.
  const areLinksLocked = computed(() => submission?.linksLocked ?? false);

  const manifestHelp = computed(() =>
    areLinksLocked.value ? FORM_LINKS_LOCKED_HINT : FORM_MANIFEST_HINT,
  );

  const submitLabel = computed(() =>
    isEdit.value ? FORM_RESUBMIT_LABEL : FORM_SUBMIT_LABEL,
  );

  const isValid = computed(
    () => submissionRequestSchema.safeParse(form.value).success,
  );

  // Форма заполняется при каждом открытии: у правки — данными заявки, у
  // новой заявки — пустыми полями, чтобы не тянуть черновик прошлой правки.
  watch(isOpen, (open) => {
    if (open) {
      form.value = createSubmissionForm(submission);
    }
  });

  /** Закрывает окно без отправки. */
  function cancel(): void {
    isOpen.value = false;
  }

  /** Отдаёт заявку странице — запрос и уведомления живут там. */
  function submit(): void {
    if (isValid.value) {
      emit('submit', form.value);
    }
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title
    :description
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField
          :label="FORM_MANIFEST_LABEL"
          :help="manifestHelp"
          required
        >
          <UInput
            v-model="form.manifestUrl"
            type="url"
            :disabled="areLinksLocked"
            :maxlength="SUBMISSION_URL_MAX_LENGTH"
            :placeholder="FORM_MANIFEST_PLACEHOLDER"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="FORM_SYSTEMS_LABEL"
          :help="FORM_SYSTEMS_HINT"
        >
          <USelectMenu
            v-model="form.systemIds"
            multiple
            value-key="value"
            :items="systemItems"
            :loading="areSystemsLoading"
            :placeholder="FORM_SYSTEMS_PLACEHOLDER"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="FORM_DESCRIPTION_LABEL"
          required
        >
          <UTextarea
            v-model="form.description"
            :maxlength="SUBMISSION_DESCRIPTION_MAX_LENGTH"
            :placeholder="FORM_DESCRIPTION_PLACEHOLDER"
            :rows="TEXTAREA_ROWS"
            autoresize
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <UiModalActions
        :cancel-label="CANCEL_LABEL"
        :submit-label
        :submit-icon="FORM_SUBMIT_ICON"
        :loading
        :disabled="!isValid"
        @cancel="cancel"
        @submit="submit"
      />
    </template>
  </UModal>
</template>
