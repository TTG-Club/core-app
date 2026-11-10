<script setup lang="ts">
  import type { FormErrorEvent } from '#ui/types';

  import type {
    CommunityNewsPublishMode,
    CommunityNewsPubState,
    CommunityNewsRequest,
  } from '../model';

  import {
    ArticlePublishDateField,
    ArticleSlugField,
  } from '~articles/editor/ui';
  import { MarkupEditor } from '~ui/markup-editor';
  import { UploadImage } from '~ui/upload';
  import {
    parseVideoUrl,
    UiVideoPlayer,
    UiVideoUrlField,
    VIDEO_UNSUPPORTED_TEXT,
    VIDEO_URL_FIELD_HINT,
    VIDEO_URL_FIELD_LABEL,
  } from '~ui/video';
  import { useWorkshopForm } from '~workshop/composable';

  import {
    COMMUNITY_NEWS_ADMIN_ROUTE,
    COMMUNITY_NEWS_API_PATH,
    COMMUNITY_NEWS_AUTHOR_HINT,
    COMMUNITY_NEWS_AUTHOR_LABEL,
    COMMUNITY_NEWS_EDITOR_TEXT,
    COMMUNITY_NEWS_FALLBACK_IMAGE,
    COMMUNITY_NEWS_IMAGE_MAX_SIZE,
    COMMUNITY_NEWS_IMAGE_SECTION,
    COMMUNITY_NEWS_PUB_STATE_OPTIONS,
    COMMUNITY_NEWS_PUBLISH_MODES,
    COMMUNITY_NEWS_SOURCE_URL_HINT,
    COMMUNITY_NEWS_SOURCE_URL_LABEL,
    getCommunityNewsEditRoute,
    getCommunityNewsRoute,
  } from '../model';
  import { CommunityNewsPreview } from '../preview';

  /**
   * Инструмент публикации новостей сообщества. Отдельный от редактора
   * новостей сайта: короче (нет кросс-постинга, тегов и типа записи), со
   * своими правами и своим API — его можно отдать другим людям или вынести из
   * админки, не трогая новости сайта.
   */
  const formRef = useTemplateRef('formRef');

  // Режим активной публикации: сразу / по расписанию (инициализация — по
  // загруженной записи, watch ниже).
  const mode = ref<CommunityNewsPublishMode>('now');

  const previewOpened = ref(false);
  const isSubmitting = ref(false);

  // Обложка ещё грузится в S3 — сохранять рано, иначе уйдёт previewImageUrl=null.
  const isCoverUploading = ref(false);

  const isSubmitBlocked = computed(
    () => isSubmitting.value || isCoverUploading.value,
  );

  /** Пустая форма новой новости: активна и публикуется сразу. */
  function getInitialState(): CommunityNewsRequest {
    return {
      url: '',
      title: '',
      authorName: '',
      sourceUrl: null,
      previewImageUrl: null,
      videoUrl: null,
      draft: false,
      active: true,
      accessibleByLink: false,
      publishDateTime: null,
      preview: '',
      content: '',
    };
  }

  const { state, submitState, previousState, onSubmit, onError } =
    useWorkshopForm<CommunityNewsRequest>({
      actionUrl: COMMUNITY_NEWS_API_PATH,
      getInitialState,
      // После создания — в режим правки: иначе повторное сохранение ушло бы
      // POST-ом и упёрлось в занятый url.
      getEditRoute: getCommunityNewsEditRoute,
      // Пустые текстовые поля бэк может отдать как null — приводим к форме.
      normalizeLoaded: (raw) => ({
        ...raw,
        authorName: raw.authorName ?? '',
        preview: raw.preview ?? '',
        content: raw.content ?? '',
      }),
      transformBeforeSubmit: (formState) => {
        const isActivePublish = !formState.draft && formState.active;
        const isInactive = !formState.draft && !formState.active;
        const sourceUrl = formState.sourceUrl?.trim();

        return {
          ...formState,
          authorName: formState.authorName.trim(),
          sourceUrl: sourceUrl || null,
          // Дата нужна только отложенной публикации; «сейчас» ставит сервер.
          publishDateTime:
            isActivePublish && mode.value === 'schedule'
              ? formState.publishDateTime
              : null,
          accessibleByLink: isInactive ? formState.accessibleByLink : false,
        };
      },
    });

  const $toast = useToast();
  const route = useRoute();
  const { copy } = useCopyAndShare();

  // Собственный url при правке — проверка slug не считает его занятым.
  const currentUrl = computed(() =>
    typeof route.params.url === 'string' && route.params.url
      ? route.params.url
      : undefined,
  );

  // «Закрыть» ведёт в список инструмента: он открыт всем, кто может публиковать.
  const closeRoute = COMMUNITY_NEWS_ADMIN_ROUTE;

  // Мост null ↔ undefined: DTO хранит previewImageUrl как string | null,
  // а UploadImage работает со string | undefined.
  const coverModel = computed<string | undefined>({
    get: () => state.value.previewImageUrl ?? undefined,
    set: (value) => {
      state.value.previewImageUrl = value ?? null;
    },
  });

  // Пустое поле первоисточника = null (ссылки нет).
  const sourceUrlModel = computed<string>({
    get: () => state.value.sourceUrl ?? '',
    set: (value) => {
      state.value.sourceUrl = value.trim() ? value : null;
    },
  });

  const videoSource = computed(() => parseVideoUrl(state.value.videoUrl));

  // Единое состояние публикации ↔ два флага (draft/active), как у новостей сайта.
  const pubState = computed<CommunityNewsPubState>({
    get: () => {
      if (state.value.draft) {
        return 'draft';
      }

      return state.value.active ? 'active' : 'inactive';
    },
    set: (value) => {
      state.value.draft = value === 'draft';
      state.value.active = value === 'active';
    },
  });

  // При «сейчас» чистим дату и в state: иначе смена ТОЛЬКО режима у
  // запланированной новости не мутирует state и сохранение молча отклоняется.
  const publishMode = computed<CommunityNewsPublishMode>({
    get: () => mode.value,
    set: (value) => {
      mode.value = value;

      if (value === 'now') {
        state.value.publishDateTime = null;
      }
    },
  });

  // Активная запись с будущей датой = запланирована. previousState меняется
  // только при загрузке из /raw и на старте создания.
  watch(
    () =>
      [
        previousState.value.draft,
        previousState.value.active,
        previousState.value.publishDateTime,
      ] as const,
    ([draft, active, date]) => {
      const isFuture = !!date && new Date(date).getTime() > Date.now();

      mode.value = !draft && active && isFuture ? 'schedule' : 'now';
    },
    { immediate: true },
  );

  const mainActionLabel = computed(() => {
    if (pubState.value === 'draft') {
      return COMMUNITY_NEWS_EDITOR_TEXT.saveDraft;
    }

    if (pubState.value === 'inactive') {
      return COMMUNITY_NEWS_EDITOR_TEXT.save;
    }

    return mode.value === 'now'
      ? COMMUNITY_NEWS_EDITOR_TEXT.publish
      : COMMUNITY_NEWS_EDITOR_TEXT.schedule;
  });

  // Ссылка-предпросмотр — у существующей новости, снятой с сайта, но открытой
  // по прямой ссылке.
  const canCopyPreviewLink = computed(
    () =>
      !!currentUrl.value
      && pubState.value === 'inactive'
      && state.value.accessibleByLink,
  );

  /** Копирует прямую ссылку на снятую новость для предпросмотра. */
  function copyPreviewLink(): void {
    if (currentUrl.value) {
      copy(`${getOrigin()}${getCommunityNewsRoute(currentUrl.value)}`);
    }
  }

  const schema = z.object({
    title: z.string().trim().nonempty(),
    url: z.string().trim().nonempty(),
    authorName: z.string().trim(),
    sourceUrl: z.url().nullable(),
    draft: z.boolean(),
    active: z.boolean(),
    accessibleByLink: z.boolean(),
    publishDateTime: z.string().nullable(),
    // Новость сообщества часто — пара фраз: обязателен анонс, текст по желанию.
    preview: z.string().trim().nonempty(),
    content: z.string().trim(),
    previewImageUrl: z.string().nullable(),
    videoUrl: z
      .string()
      .nullable()
      .refine((value) => !value || !!parseVideoUrl(value), {
        message: VIDEO_UNSUPPORTED_TEXT,
      }),
  });

  /** Запускает отправку формы с кнопки сохранения. */
  function submitMain(): void {
    isSubmitting.value = true;
    formRef.value?.submit();
  }

  /**
   * Сохраняет новость. Единая точка отправки: здесь же проверяем, что обложка
   * догрузилась и дата отложенной публикации — в будущем.
   */
  async function handleSubmit(): Promise<void> {
    if (isCoverUploading.value) {
      $toast.add({
        title: COMMUNITY_NEWS_EDITOR_TEXT.coverUploadingTitle,
        description: COMMUNITY_NEWS_EDITOR_TEXT.coverUploadingDescription,
        color: 'warning',
      });

      isSubmitting.value = false;

      return;
    }

    // Для отложенной публикации дата обязательна и должна быть в будущем.
    if (pubState.value === 'active' && mode.value === 'schedule') {
      const date = state.value.publishDateTime;

      if (!date || new Date(date).getTime() <= Date.now()) {
        $toast.add({
          title: COMMUNITY_NEWS_EDITOR_TEXT.wrongDateTitle,
          description: COMMUNITY_NEWS_EDITOR_TEXT.wrongDateDescription,
          color: 'warning',
        });

        isSubmitting.value = false;

        return;
      }
    }

    await onSubmit();
    isSubmitting.value = false;
  }

  /** Показывает ошибки валидации и снимает индикатор отправки. */
  function handleError(event: FormErrorEvent): void {
    onError(event);
    isSubmitting.value = false;
  }
</script>

<template>
  <UForm
    ref="formRef"
    :schema
    class="grid gap-8 pb-24"
    :state
    @submit="handleSubmit"
    @error="handleError"
  >
    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">
          {{ COMMUNITY_NEWS_EDITOR_TEXT.mainSection }}
        </h2>
      </template>

      <div class="grid grid-cols-1 gap-6 sm:grid-cols-5">
        <div class="flex flex-col gap-5 sm:col-span-3">
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <UFormField
              :label="COMMUNITY_NEWS_EDITOR_TEXT.titleLabel"
              name="title"
              required
            >
              <UInput
                v-model="state.title"
                :placeholder="COMMUNITY_NEWS_EDITOR_TEXT.titlePlaceholder"
                class="w-full"
              />
            </UFormField>

            <UFormField
              :label="COMMUNITY_NEWS_EDITOR_TEXT.urlLabel"
              name="url"
              required
            >
              <ArticleSlugField
                v-model="state.url"
                :title="state.title"
                :current-url="currentUrl"
                :api-path="COMMUNITY_NEWS_API_PATH"
              />
            </UFormField>

            <UFormField
              :label="COMMUNITY_NEWS_AUTHOR_LABEL"
              :help="COMMUNITY_NEWS_AUTHOR_HINT"
              name="authorName"
            >
              <UInput
                v-model="state.authorName"
                icon="tabler:user-circle"
                :placeholder="COMMUNITY_NEWS_EDITOR_TEXT.authorPlaceholder"
                class="w-full"
              />
            </UFormField>

            <UFormField
              :label="COMMUNITY_NEWS_SOURCE_URL_LABEL"
              :help="COMMUNITY_NEWS_SOURCE_URL_HINT"
              name="sourceUrl"
            >
              <UInput
                v-model="sourceUrlModel"
                icon="tabler:link"
                :placeholder="COMMUNITY_NEWS_EDITOR_TEXT.sourceUrlPlaceholder"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>

        <!-- Публикация -->
        <div
          class="flex flex-col gap-4 border-t border-default pt-4 sm:col-span-2 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6"
        >
          <UTabs
            v-model="pubState"
            :items="COMMUNITY_NEWS_PUB_STATE_OPTIONS"
            :content="false"
            size="sm"
            class="w-fit"
          />

          <UTabs
            v-if="pubState === 'active'"
            v-model="publishMode"
            :items="COMMUNITY_NEWS_PUBLISH_MODES"
            :content="false"
            size="sm"
            class="w-fit"
          />

          <UFormField
            v-if="pubState === 'active' && mode === 'schedule'"
            name="publishDateTime"
            required
          >
            <ArticlePublishDateField v-model="state.publishDateTime" />
          </UFormField>

          <div
            v-else-if="pubState === 'inactive'"
            class="flex flex-col gap-2"
          >
            <UCheckbox
              v-model="state.accessibleByLink"
              :label="COMMUNITY_NEWS_EDITOR_TEXT.accessibleByLinkLabel"
              :description="
                COMMUNITY_NEWS_EDITOR_TEXT.accessibleByLinkDescription
              "
            />

            <UButton
              v-if="canCopyPreviewLink"
              class="self-start"
              variant="soft"
              color="neutral"
              size="sm"
              icon="tabler:link"
              @click.left.exact.prevent="copyPreviewLink"
            >
              {{ COMMUNITY_NEWS_EDITOR_TEXT.copyPreviewLink }}
            </UButton>
          </div>
        </div>
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">
          {{ COMMUNITY_NEWS_EDITOR_TEXT.mediaSection }}
        </h2>
      </template>

      <div
        class="mb-4 grid grid-cols-1 gap-4 border-b border-default pb-4 sm:grid-cols-2 sm:items-start"
      >
        <UFormField
          :label="VIDEO_URL_FIELD_LABEL"
          :help="VIDEO_URL_FIELD_HINT"
          name="videoUrl"
        >
          <UiVideoUrlField v-model="state.videoUrl" />
        </UFormField>

        <UiVideoPlayer
          v-if="videoSource"
          :url="videoSource.url"
          :title="state.title"
          :poster="coverModel"
        />
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
        <div
          class="relative overflow-hidden rounded-lg border border-default bg-muted"
        >
          <NuxtImg
            v-slot="{ src, isLoaded, imgAttrs }"
            :key="coverModel"
            :src="coverModel ?? ''"
            custom
          >
            <img
              v-if="isLoaded"
              v-bind="imgAttrs"
              class="aspect-video w-full object-cover"
              :src="src"
              :alt="state.title"
            />

            <img
              v-else
              class="aspect-video w-full object-cover opacity-50"
              :src="COMMUNITY_NEWS_FALLBACK_IMAGE"
              :alt="COMMUNITY_NEWS_EDITOR_TEXT.noCoverAlt"
            />
          </NuxtImg>

          <UButton
            v-if="coverModel"
            icon="tabler:trash"
            color="error"
            size="sm"
            class="absolute top-2 right-2"
            :aria-label="COMMUNITY_NEWS_EDITOR_TEXT.removeCover"
            @click.left.exact.prevent="coverModel = undefined"
          />
        </div>

        <UploadImage
          v-model="coverModel"
          v-model:uploading="isCoverUploading"
          :section="COMMUNITY_NEWS_IMAGE_SECTION"
          :max-size="COMMUNITY_NEWS_IMAGE_MAX_SIZE"
        />
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">
          {{ COMMUNITY_NEWS_EDITOR_TEXT.previewSection }}
        </h2>
      </template>

      <UFormField
        name="preview"
        :help="COMMUNITY_NEWS_EDITOR_TEXT.previewHelp"
        required
      >
        <MarkupEditor
          v-model="state.preview"
          :placeholder="COMMUNITY_NEWS_EDITOR_TEXT.previewPlaceholder"
        />
      </UFormField>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">
          {{ COMMUNITY_NEWS_EDITOR_TEXT.contentSection }}
          <span class="text-sm font-normal text-muted">
            {{ COMMUNITY_NEWS_EDITOR_TEXT.optionalMark }}
          </span>
        </h2>
      </template>

      <UFormField name="content">
        <MarkupEditor
          v-model="state.content"
          :placeholder="COMMUNITY_NEWS_EDITOR_TEXT.contentPlaceholder"
        />
      </UFormField>
    </UCard>

    <div class="sticky bottom-0 z-20 col-span-full">
      <div
        class="flex flex-wrap items-center justify-end gap-2 border-t border-default bg-default/95 px-4 py-3 backdrop-blur"
      >
        <UButton
          variant="ghost"
          color="neutral"
          icon="tabler:x"
          class="mr-auto"
          :to="closeRoute"
        >
          {{ COMMUNITY_NEWS_EDITOR_TEXT.close }}
        </UButton>

        <UButton
          variant="soft"
          color="neutral"
          @click.left.exact.prevent="previewOpened = true"
        >
          {{ COMMUNITY_NEWS_EDITOR_TEXT.preview }}
        </UButton>

        <CommunityNewsPreview
          v-model:open="previewOpened"
          :state="submitState"
        />

        <UButton
          :loading="isSubmitBlocked"
          :disabled="isSubmitBlocked"
          @click.left.exact.prevent="submitMain"
        >
          {{ mainActionLabel }}
        </UButton>
      </div>
    </div>
  </UForm>
</template>
