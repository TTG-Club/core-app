<script setup lang="ts">
  import { useCharacterSheet } from '../../composables';
  import {
    CLASSES_MODAL_LABELS,
    getCharacterClasses,
    getClassDisplayName,
    getTotalClassLevel,
    LEVEL_MAX,
  } from '../../model';
  import SheetClassWizardModal from './SheetClassWizardModal.vue';

  const emit = defineEmits<{
    close: [];
  }>();

  const overlay = useOverlay();

  const { character, canEdit, removeClass } = useCharacterSheet();

  // Мастер выбора класса открывается поверх списка: он же и применяет класс к
  // листу, поэтому здесь остаётся только выбрать режим.
  const classWizardModal = overlay.create(SheetClassWizardModal, {
    props: { mode: 'primary' as const },
  });

  /**
   * Класс, который спрашивают удалить; null — подтверждения нет. Подтверждение
   * инлайновое, а не отдельным диалогом: модалка в модалке помечается
   * `aria-hidden` внешней — до кнопок не добраться ни с клавиатуры, ни
   * скринридером.
   */
  const classToRemove = ref<string | null>(null);

  const classes = computed(() => getCharacterClasses(character.value));

  const totalLevel = computed(() => getTotalClassLevel(classes.value));

  /**
   * Добавить класс можно, пока есть свободный уровень и уже выбран основной:
   * мультикласс начинается со второго класса.
   */
  const canAddClass = computed(
    () =>
      canEdit.value && classes.value.length > 0 && totalLevel.value < LEVEL_MAX,
  );

  const addHint = computed(() =>
    classes.value.length > 0 && totalLevel.value >= LEVEL_MAX
      ? CLASSES_MODAL_LABELS.levelLimit
      : CLASSES_MODAL_LABELS.hint,
  );

  const rows = computed(() =>
    classes.value.map((characterClass, index) => ({
      url: characterClass.url,
      name: getClassDisplayName(characterClass),
      level: characterClass.level,
      // Первый класс на листе особый: он один даёт стартовое снаряжение и
      // максимум кости хитов на первом уровне.
      isPrimary: index === 0,
      isConfirming: classToRemove.value === characterClass.url,
    })),
  );

  function handleEdit() {
    classWizardModal.open({ mode: 'primary' });
  }

  function handleAdd() {
    classWizardModal.open({ mode: 'add' });
  }

  function handleRemoveClick(classUrl: string) {
    classToRemove.value = classUrl;
  }

  function handleRemoveCancel() {
    classToRemove.value = null;
  }

  function handleRemoveConfirm() {
    if (classToRemove.value) {
      removeClass(classToRemove.value);
    }

    classToRemove.value = null;
  }
</script>

<template>
  <UModal
    :title="CLASSES_MODAL_LABELS.title"
    :ui="{ content: 'sm:max-w-lg' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <div
          v-if="rows.length"
          class="flex flex-col gap-2"
        >
          <div
            v-for="row in rows"
            :key="row.url"
            class="flex flex-col gap-2 rounded-md bg-elevated/40 px-3 py-2"
          >
            <div class="flex items-center gap-3">
              <div class="flex min-w-0 grow flex-col">
                <span class="truncate text-sm font-bold text-highlighted">
                  {{ row.name }}
                </span>

                <span class="text-xs text-muted">
                  {{ row.level }} {{ CLASSES_MODAL_LABELS.levelSuffix }}
                </span>
              </div>

              <UButton
                v-if="row.isPrimary"
                :label="CLASSES_MODAL_LABELS.edit"
                icon="tabler:pencil"
                color="neutral"
                variant="ghost"
                size="xs"
                :disabled="!canEdit"
                @click.left.exact.prevent="handleEdit"
              />

              <UTooltip :text="CLASSES_MODAL_LABELS.remove">
                <UButton
                  icon="tabler:trash"
                  color="error"
                  variant="ghost"
                  size="xs"
                  square
                  :disabled="!canEdit || row.isConfirming"
                  :aria-label="CLASSES_MODAL_LABELS.remove"
                  @click.left.exact.prevent="handleRemoveClick(row.url)"
                />
              </UTooltip>
            </div>

            <!-- Подтверждение прямо в строке: вложенная модалка оказалась бы
              под `aria-hidden` внешней -->
            <div
              v-if="row.isConfirming"
              class="flex flex-col gap-2 border-t border-default/50 pt-2"
            >
              <span class="text-xs text-toned">
                {{ CLASSES_MODAL_LABELS.removeDescription }}
              </span>

              <div class="flex justify-end gap-2">
                <UButton
                  :label="CLASSES_MODAL_LABELS.removeCancel"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  @click.left.exact.prevent="handleRemoveCancel"
                />

                <UButton
                  :label="CLASSES_MODAL_LABELS.removeConfirm"
                  icon="tabler:trash"
                  color="error"
                  size="xs"
                  @click.left.exact.prevent="handleRemoveConfirm"
                />
              </div>
            </div>
          </div>
        </div>

        <span
          v-else
          class="text-sm text-dimmed"
        >
          {{ CLASSES_MODAL_LABELS.empty }}
        </span>

        <div class="flex items-center justify-between gap-2 text-sm">
          <span class="text-muted">{{ CLASSES_MODAL_LABELS.totalLevel }}</span>

          <span class="font-bold text-highlighted">{{ totalLevel }}</span>
        </div>

        <span class="text-xs text-dimmed">{{ addHint }}</span>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <UButton
          v-if="rows.length"
          :label="CLASSES_MODAL_LABELS.add"
          icon="tabler:plus"
          color="primary"
          variant="subtle"
          :disabled="!canAddClass"
          @click.left.exact.prevent="handleAdd"
        />

        <UButton
          v-else
          :label="CLASSES_MODAL_LABELS.choose"
          icon="tabler:plus"
          color="primary"
          :disabled="!canEdit"
          @click.left.exact.prevent="handleEdit"
        />

        <UButton
          :label="CLASSES_MODAL_LABELS.close"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="emit('close')"
        />
      </div>
    </template>
  </UModal>
</template>
