<script setup lang="ts">
  import type { DrawingTool } from '../model';

  import { useBugReport } from '../composables';
  import { DEFAULT_BRUSH_COLOR, DEFAULT_BRUSH_SIZE } from '../model';
  import {
    BugReportAuthor,
    BugReportCanvas,
    BugReportColorPicker,
    BugReportTextContext,
  } from './ui';

  const {
    isModalOpen,
    capturedPageUrl,
    screenshot,
    textSelection,
    setScreenshot,
    clearScreenshot,
    clearTextSelection,
    cancel,
    submit,
  } = useBugReport();

  const canvasRef = ref<InstanceType<typeof BugReportCanvas>>();

  const description = ref('');
  const brushColor = ref(DEFAULT_BRUSH_COLOR.value);
  const drawingTool = ref<DrawingTool>('brush');
  const isSubmitting = ref(false);

  const screenshotUrl = ref('');

  const hasScreenshot = computed(() => Boolean(screenshotUrl.value));

  const isMac = ref(false);
  const fileInputRef = ref<HTMLInputElement | null>(null);

  onMounted(() => {
    isMac.value = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  });

  function triggerFileSelect(): void {
    fileInputRef.value?.click();
  }

  function handleFileChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      const file = target.files?.[0];

      if (file) {
        setScreenshot(file);
        target.value = '';
      }
    }
  }

  watch(
    screenshot,
    (newFile) => {
      if (screenshotUrl.value) {
        URL.revokeObjectURL(screenshotUrl.value);
        screenshotUrl.value = '';
      }

      if (newFile) {
        screenshotUrl.value = URL.createObjectURL(newFile);
      }
    },
    { immediate: true },
  );

  const isFormValid = computed(() => description.value.trim().length > 0);

  async function handleSubmit(): Promise<void> {
    if (!isFormValid.value) {
      return;
    }

    isSubmitting.value = true;

    try {
      const screenshotBlob = canvasRef.value
        ? await canvasRef.value.exportToBlob()
        : null;

      const success = await submit(description.value.trim(), screenshotBlob);

      if (success) {
        description.value = '';
      }
    } finally {
      isSubmitting.value = false;
    }
  }

  /**
   * Обработчик нажатия клавиш в поле ввода описания.
   * Выполняет отправку формы при нажатии Ctrl+Enter (Windows) или Cmd+Enter (Mac).
   *
   * @param event Событие клавиатуры.
   */
  function handleKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  }

  function handleCancel(): void {
    description.value = '';
    cancel();
  }

  function handleUndo(): void {
    canvasRef.value?.undo();
  }

  watch(isModalOpen, (opened) => {
    if (!opened) {
      description.value = '';
      brushColor.value = DEFAULT_BRUSH_COLOR.value;
      drawingTool.value = 'brush';
    }
  });

  // Поддержка вставки скриншота из буфера обмена (Ctrl+V)
  // Используем фазу capture, чтобы перехватить событие до UTextarea
  useEventListener(
    'paste',
    (event: ClipboardEvent) => {
      if (!isModalOpen.value) {
        return;
      }

      const items = event.clipboardData?.items;

      if (!items) {
        return;
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item && item.type.includes('image')) {
          const file = item.getAsFile();

          if (file) {
            setScreenshot(file);
            event.preventDefault();
            event.stopPropagation();

            break;
          }
        }
      }
    },
    { capture: true },
  );

  onUnmounted(() => {
    if (screenshotUrl.value) {
      URL.revokeObjectURL(screenshotUrl.value);
    }
  });
</script>

<template>
  <UModal
    v-model:open="isModalOpen"
    title="Сообщить о баге"
    class="sm:w-fit sm:max-w-[90vw]"
  >
    <template #body>
      <div class="flex flex-col gap-4 lg:flex-row">
        <!-- Левая колонка: скриншот + инструменты -->
        <!-- На маленьких экранах скриншот-колонка скрыта -->
        <div class="hidden shrink-0 gap-2 lg:flex">
          <!-- Область скриншота -->
          <div
            :class="[
              'max-h-[70vh] min-w-[300px] overflow-auto rounded-lg border border-default',
              !hasScreenshot && 'flex flex-col self-stretch',
            ]"
          >
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileChange"
            />

            <BugReportCanvas
              v-if="hasScreenshot"
              ref="canvasRef"
              :screenshot-url="screenshotUrl"
              :brush-color="brushColor"
              :brush-size="DEFAULT_BRUSH_SIZE"
              :drawing-tool="drawingTool"
            />

            <div
              v-else
              class="flex min-h-100 w-75 flex-1 cursor-pointer flex-col items-center justify-center gap-2 bg-elevated text-muted transition-colors hover:bg-elevated/80"
              @click.left.exact.prevent="triggerFileSelect"
            >
              <UIcon
                name="tabler:photo-plus"
                class="size-10"
              />

              <span class="text-sm font-medium text-dimmed">
                Вставьте скриншот
              </span>

              <span
                class="flex max-w-70 flex-wrap items-center justify-center gap-1 text-center text-xs leading-5 text-muted"
              >
                Сделайте снимок экрана
                <template v-if="isMac">
                  <UKbd
                    value="meta"
                    size="sm"
                  />
                  +
                  <UKbd
                    value="Ctrl"
                    size="sm"
                  />
                  +
                  <UKbd
                    value="Shift"
                    size="sm"
                  />
                  +
                  <UKbd
                    value="4"
                    size="sm"
                  />
                </template>

                <template v-else>
                  <UKbd
                    value="meta"
                    size="sm"
                  />
                  +
                  <UKbd
                    value="Shift"
                    size="sm"
                  />
                  +
                  <UKbd
                    value="S"
                    size="sm"
                  />
                </template>
                и нажмите
                <UKbd
                  value="meta"
                  size="sm"
                />
                +
                <UKbd
                  value="V"
                  size="sm"
                />
              </span>

              <span class="text-xs text-muted">
                или нажмите для выбора файла с ПК
              </span>
            </div>
          </div>

          <!-- Инструменты рисования (вертикальная панель) -->
          <div
            :class="[
              'flex flex-col items-center gap-2 rounded-lg border border-default bg-elevated p-2 transition-opacity duration-150',
              !hasScreenshot && 'pointer-events-none opacity-40',
            ]"
          >
            <BugReportColorPicker
              v-model="brushColor"
              :disabled="!hasScreenshot"
              vertical
            />

            <USeparator class="w-full" />

            <UButton
              icon="tabler:pencil"
              :variant="drawingTool === 'brush' ? 'solid' : 'ghost'"
              :color="drawingTool === 'brush' ? 'primary' : 'neutral'"
              size="sm"
              :disabled="!hasScreenshot"
              @click.left.exact.prevent="drawingTool = 'brush'"
            />

            <UButton
              icon="tabler:circle"
              :variant="drawingTool === 'circle' ? 'solid' : 'ghost'"
              :color="drawingTool === 'circle' ? 'primary' : 'neutral'"
              size="sm"
              :disabled="!hasScreenshot"
              @click.left.exact.prevent="drawingTool = 'circle'"
            />

            <UButton
              icon="tabler:square"
              :variant="drawingTool === 'rectangle' ? 'solid' : 'ghost'"
              :color="drawingTool === 'rectangle' ? 'primary' : 'neutral'"
              size="sm"
              :disabled="!hasScreenshot"
              @click.left.exact.prevent="drawingTool = 'rectangle'"
            />

            <USeparator class="w-full" />

            <UButton
              icon="tabler:arrow-back-up"
              variant="ghost"
              color="neutral"
              size="sm"
              :disabled="!hasScreenshot || !canvasRef?.hasStrokes"
              @click.left.exact.prevent="handleUndo"
            />

            <div class="mt-auto" />

            <USeparator class="w-full" />

            <UButton
              icon="tabler:trash"
              variant="ghost"
              color="error"
              size="sm"
              :disabled="!hasScreenshot"
              @click.left.exact.prevent="clearScreenshot"
            />
          </div>
        </div>

        <!-- Правая колонка: форма -->
        <div class="flex w-full shrink-0 flex-col gap-4 lg:w-100">
          <!-- Автор и URL -->
          <div class="flex flex-col gap-3">
            <BugReportAuthor />

            <NuxtLink
              :to="capturedPageUrl"
              target="_blank"
              class="flex items-center gap-2 text-xs leading-4 text-muted no-underline transition-colors duration-150 hover:text-highlighted"
            >
              <UIcon
                name="tabler:link"
                class="size-4 shrink-0"
              />

              <span>Страница: {{ capturedPageUrl }}</span>
            </NuxtLink>
          </div>

          <USeparator />

          <!-- Контекст выделенного текста -->
          <BugReportTextContext
            v-if="textSelection"
            :selection="textSelection"
            @clear="clearTextSelection"
          />

          <div
            v-else
            class="flex items-center gap-1.5 rounded-lg border border-dashed border-default bg-elevated p-2 px-3 text-xs leading-4 text-muted"
          >
            <UIcon
              name="tabler:text-scan-2"
              class="size-4 shrink-0"
            />

            <span>
              Выделите текст на странице и нажмите
              <strong>«Ошибка в тексте»</strong>
            </span>
          </div>

          <!-- Описание бага -->
          <UFormField
            name="description"
            label="Описание проблемы"
            required
          >
            <UTextarea
              v-model="description"
              autoresize
              :rows="5"
              :maxrows="10"
              placeholder="Опишите, что произошло..."
              @keydown="handleKeyDown"
            />
          </UFormField>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          label="Отменить"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          label="Отправить"
          :loading="isSubmitting"
          :disabled="!isFormValid"
          @click.left.exact.prevent="handleSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
