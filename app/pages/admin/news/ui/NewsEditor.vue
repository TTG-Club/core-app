<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import { UploadImage } from '~ui/upload';

  type CreateArticleRequest = {
    url: string;
    title: string;
    previewImageUrl: string;
    publishDateTime: string;
    preview: string;
    content: string;
  };

  type CreateFormState = {
    url: string;
    title: string;
    publishDateTimeLocal: string;
    preview: string;
    content: string;
    image: string;
  };

  type FieldErrors = Partial<
    Record<keyof CreateFormState | 'previewImageUrl', string>
  >;

  const getCurrentDatetimeLocal = (): string => {
    const now = new Date();

    const pad = (value: number): string => {
      return value.toString().padStart(2, '0');
    };

    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formState = reactive<CreateFormState>({
    url: '',
    title: '',
    publishDateTimeLocal: getCurrentDatetimeLocal(),
    preview: '',
    content: '',
    image: '',
  });

  const isSubmitting = ref<boolean>(false);
  const submitErrorMessage = ref<string>('');
  const fieldErrors = ref<FieldErrors>({});

  const toIsoFromDatetimeLocal = (datetimeLocal: string): string | null => {
    if (datetimeLocal.trim().length === 0) {
      return null;
    }

    const parsed = new Date(datetimeLocal);

    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed.toISOString();
  };

  const isValidUrl = (rawUrl: string): boolean => {
    const trimmed = rawUrl.trim();

    if (trimmed.length === 0) {
      return false;
    }

    try {
      new URL(trimmed);

      return true;
    } catch {
      return false;
    }
  };

  const previewImageUrl = computed<string>(() => {
    return formState.image.trim();
  });

  watch(
    () => formState.image,
    () => {
      if (fieldErrors.value.previewImageUrl) {
        fieldErrors.value = {
          ...fieldErrors.value,
          previewImageUrl: undefined,
        };
      }
    },
  );

  const validateForm = (): boolean => {
    const nextErrors: FieldErrors = {};

    if (formState.title.trim().length < 3) {
      nextErrors.title = 'Заголовок должен быть не короче 3 символов.';
    }

    if (!isValidUrl(formState.url)) {
      nextErrors.url =
        'Укажите корректный URL (например, https://example.com/article).';
    }

    const publishIso = toIsoFromDatetimeLocal(formState.publishDateTimeLocal);

    if (!publishIso) {
      nextErrors.publishDateTimeLocal =
        'Укажите корректные дату и время публикации.';
    }

    if (formState.preview.trim().length < 10) {
      nextErrors.preview = 'Превью должно быть не короче 10 символов.';
    }

    if (formState.content.trim().length < 20) {
      nextErrors.content = 'Контент должен быть не короче 20 символов.';
    }

    if (!isValidUrl(previewImageUrl.value)) {
      nextErrors.previewImageUrl = 'Загрузите изображение для превью.';
    }

    fieldErrors.value = nextErrors;

    return Object.keys(nextErrors).length === 0;
  };

  const requestBody = computed<CreateArticleRequest | null>(() => {
    const publishIso = toIsoFromDatetimeLocal(formState.publishDateTimeLocal);

    if (!publishIso) {
      return null;
    }

    const previewUrl = previewImageUrl.value.trim();

    if (!isValidUrl(previewUrl)) {
      return null;
    }

    return {
      url: formState.url.trim(),
      title: formState.title.trim(),
      previewImageUrl: previewUrl,
      publishDateTime: publishIso,
      preview: formState.preview.trim(),
      content: formState.content.trim(),
    };
  });

  const onSubmit = async () => {
    submitErrorMessage.value = '';

    if (!validateForm()) {
      return;
    }

    const body = requestBody.value;

    if (!body) {
      submitErrorMessage.value =
        'Проверьте дату публикации и изображение превью.';

      return;
    }

    isSubmitting.value = true;

    try {
      await $fetch('/api/v2/articles', {
        method: 'POST',
        body,
      });

      await navigateTo('/news');
    } catch {
      submitErrorMessage.value =
        'Не удалось создать новость. Проверьте данные и повторите попытку.';
    } finally {
      isSubmitting.value = false;
    }
  };

  const onPreview = () => {
    // hook под предпросмотр
  };
</script>

<template>
  <UContainer class="py-6">
    <div class="flex flex-col gap-4">
      <UAlert
        v-if="submitErrorMessage"
        color="error"
        variant="soft"
        title="Ошибка"
        :description="submitErrorMessage"
      />

      <UCard>
        <UForm @submit.prevent="onSubmit">
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div class="lg:col-span-7">
              <UFormField
                label="Заголовок"
                required
                :error="fieldErrors.title"
              >
                <UInput
                  v-model="formState.title"
                  size="lg"
                />
              </UFormField>
            </div>

            <div class="lg:col-span-5">
              <UFormField
                label="Дата и время публикации"
                required
                :error="fieldErrors.publishDateTimeLocal"
              >
                <UInput
                  v-model="formState.publishDateTimeLocal"
                  type="datetime-local"
                  size="lg"
                />
              </UFormField>
            </div>

            <div class="lg:col-span-7">
              <UFormField
                label="URL статьи"
                required
                :error="fieldErrors.url"
              >
                <UInput
                  v-model="formState.url"
                  size="lg"
                />
              </UFormField>
            </div>

            <div class="lg:col-span-12">
              <UFormField
                label="Короткое превью"
                required
                :error="fieldErrors.preview"
              >
                <UTextarea
                  v-model="formState.preview"
                  :rows="4"
                />
              </UFormField>
            </div>

            <div class="lg:col-span-12">
              <UFormField
                label="Контент"
                required
                :error="fieldErrors.content"
              >
                <UTextarea
                  v-model="formState.content"
                  :rows="10"
                />
              </UFormField>
            </div>

            <div class="lg:col-span-12">
              <UFormField
                label="Изображение превью"
                required
                :error="fieldErrors.previewImageUrl"
              >
                <div class="flex items-start gap-6">
                  <UploadImage
                    v-model="formState.image"
                    section="news"
                    max-size="1024"
                  />

                  <div class="w-48 shrink-0">
                    <div class="overflow-hidden rounded-lg border">
                      <img
                        :src="formState.image || '/img/no-img.webp'"
                        alt="Uploaded image"
                        class="h-48 w-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              </UFormField>
            </div>
          </div>

          <div class="mt-6 flex items-center justify-end gap-2">
            <UButton
              type="button"
              variant="soft"
              color="neutral"
              @click="onPreview"
            >
              Предпросмотр
            </UButton>

            <UButton
              color="primary"
              type="submit"
              :loading="isSubmitting"
            >
              Сохранить
            </UButton>
          </div>
        </UForm>
      </UCard>
    </div>
  </UContainer>
</template>
