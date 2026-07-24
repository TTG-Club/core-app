<script setup lang="ts">
  import type { FeatureOrigin } from '../../model';

  import { MarkupEditor } from '~ui/markup-editor';

  import { useCharacterSheet } from '../../composables';
  import {
    FEATURE_ORIGIN_LABELS,
    FEATURE_ORIGIN_OPTIONS,
    parseStoredMarkupNodes,
  } from '../../model';

  // Идентификатор редактируемой особенности — прокидывается при открытии
  // (`open({ featureId })`); саму особенность модалка достаёт из состояния листа.
  const { featureId } = defineProps<{
    featureId: string;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, updateFeature } = useCharacterSheet();

  // Снимок редактируемой особенности на момент открытия. Модалка размонтируется
  // при закрытии, поэтому setup выполняется заново на каждое открытие — снимок
  // всегда свежий, а реактивность здесь не нужна (правки применяются по кнопке).
  const editedFeature =
    character.value.features.find((item) => item.id === featureId) ?? null;

  const draftName = ref(editedFeature?.name ?? '');

  const draftOrigin = ref<FeatureOrigin>(editedFeature?.origin ?? 'none');

  const draftChoice = ref(editedFeature?.choice ?? '');

  // Описание сидируем хранимой формой (JSON-массив узлов) — редактор развернёт
  // её в исходник через `toMarkupSource`. Пустое описание — пустой редактор.
  const draftDescription = ref(
    editedFeature?.description.length
      ? JSON.stringify(editedFeature.description)
      : '',
  );

  const isApplyDisabled = computed(() => !draftName.value.trim());

  // Варианты происхождения: базовый набор ручного добавления плюс текущее
  // происхождение особенности (например «Черта»/«Подвид»), чтобы оно
  // отображалось и его можно было сохранить как есть.
  const originOptions = computed(() => {
    const current = editedFeature?.origin;

    if (
      !current
      || FEATURE_ORIGIN_OPTIONS.some((option) => option.value === current)
    ) {
      return FEATURE_ORIGIN_OPTIONS;
    }

    return [
      { label: FEATURE_ORIGIN_LABELS[current], value: current },
      ...FEATURE_ORIGIN_OPTIONS,
    ];
  });

  /**
   * Название источника по выбранному происхождению: вид/класс берут название с
   * листа; при неизменённом происхождении сохраняется прежний источник
   * (например, категория черты), иначе — сбрасывается.
   */
  function getOriginName(origin: FeatureOrigin): string {
    if (origin === 'species') {
      return character.value.species?.name ?? '';
    }

    if (origin === 'class') {
      return character.value.characterClass?.name ?? '';
    }

    return origin === editedFeature?.origin
      ? (editedFeature?.originName ?? '')
      : '';
  }

  function handleApply() {
    const name = draftName.value.trim();

    if (!name) {
      return;
    }

    updateFeature(featureId, {
      name,
      description: parseStoredMarkupNodes(draftDescription.value),
      origin: draftOrigin.value,
      originName: getOriginName(draftOrigin.value),
      choice: draftChoice.value.trim() || null,
    });

    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    title="Редактирование особенности"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <div class="flex items-end gap-3">
          <div class="flex min-w-0 grow flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              Название
            </span>

            <UInput
              v-model="draftName"
              placeholder="Название особенности"
            />
          </div>

          <div class="flex w-40 shrink-0 flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              Источник
            </span>

            <USelect
              v-model="draftOrigin"
              :items="originOptions"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-bold text-muted uppercase">
            Выбор
          </span>

          <UInput
            v-model="draftChoice"
            placeholder="Например: красный дракон"
          />
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-bold text-muted uppercase">
            Описание
          </span>

          <MarkupEditor
            v-model="draftDescription"
            placeholder="Опиши особенность"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Отмена"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          label="Сохранить"
          color="primary"
          :disabled="isApplyDisabled"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
