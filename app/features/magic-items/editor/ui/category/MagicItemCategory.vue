<script setup lang="ts">
  import type { MagicItemCategory } from '../../../model';

  import {
    getMagicItemBaseItemsPlaceholder,
    getMagicItemBaseItemsText,
    MAGIC_ITEM_FORM_LABELS,
  } from '../../../model';
  import { SelectMagicItemCategory } from './ui';

  const { baseItemUrls, baseItemNames } = defineProps<{
    /** Слаги связанных предметов, выбранных на вкладке «Свойства». */
    baseItemUrls: Array<string>;

    /** Названия предметов по слагу — их знает поле выбора. */
    baseItemNames: Record<string, string>;
  }>();

  const emit = defineEmits<{
    /** Просьба открыть поле выбора связанных предметов. */
    'pick-base-items': [];
  }>();

  const model = defineModel<MagicItemCategory>({
    required: true,
  });

  /** Перечень связанных предметов — тем же текстом, что встанет на странице. */
  const baseItemsText = computed(() =>
    getMagicItemBaseItemsText(baseItemUrls, baseItemNames),
  );

  /**
   * Что стоит в нередактируемом поле: перечень, причина его отсутствия или
   * приглашение выбрать.
   */
  const baseItemsLabel = computed(
    () =>
      baseItemsText.value
      || getMagicItemBaseItemsPlaceholder(baseItemUrls.length),
  );

  /** Перечень читается как значение, остальное — как подсказка пустого поля. */
  const baseItemsLabelClass = computed(() =>
    baseItemsText.value ? 'text-default' : 'text-dimmed',
  );

  /** Подпись кнопки: без выбранного она зовёт выбрать, с выбранным — изменить. */
  const pickButtonLabel = computed(() =>
    baseItemUrls.length
      ? MAGIC_ITEM_FORM_LABELS.categoryBaseItemsChange
      : MAGIC_ITEM_FORM_LABELS.categoryBaseItemsPick,
  );

  function updateType(value: string | undefined) {
    model.value.type = value;

    model.value.clarification =
      model.value.type !== value ? undefined : model.value.clarification;
  }
</script>

<template>
  <UForm
    class="col-span-full grid grid-cols-1 gap-4 md:grid-cols-24"
    attach
    :state="model"
  >
    <UFormField
      class="md:col-span-8"
      :label="MAGIC_ITEM_FORM_LABELS.category"
      name="type"
    >
      <SelectMagicItemCategory
        :model-value="model.type"
        @update:model-value="updateType"
      />
    </UFormField>

    <div class="flex flex-col gap-4 md:col-span-16">
      <!-- Перечень не редактируется: его собирает выбор связанных предметов, а
        кнопка ведёт к этому выбору — вписывать названия второй раз незачем -->
      <UFormField
        :label="MAGIC_ITEM_FORM_LABELS.categoryBaseItems"
        :help="MAGIC_ITEM_FORM_LABELS.categoryBaseItemsHint"
      >
        <div class="flex items-start gap-2">
          <div
            class="flex min-h-8 min-w-0 grow items-center gap-2 rounded-md bg-elevated/50 px-2.5 py-1.5 text-sm ring ring-accented ring-inset"
            :class="baseItemsLabelClass"
          >
            <UIcon
              name="tabler:lock"
              class="size-4 shrink-0 text-dimmed"
            />

            <span class="min-w-0">{{ baseItemsLabel }}</span>
          </div>

          <UButton
            class="shrink-0"
            color="neutral"
            variant="subtle"
            trailing-icon="tabler:arrow-right"
            :label="pickButtonLabel"
            @click.left.exact.prevent="emit('pick-base-items')"
          />
        </div>
      </UFormField>

      <UFormField
        :label="MAGIC_ITEM_FORM_LABELS.categoryClarification"
        :help="MAGIC_ITEM_FORM_LABELS.categoryClarificationHint"
        name="clarification"
      >
        <UInput
          v-model="model.clarification"
          :placeholder="MAGIC_ITEM_FORM_LABELS.categoryClarificationPlaceholder"
        />
      </UFormField>
    </div>
  </UForm>
</template>
