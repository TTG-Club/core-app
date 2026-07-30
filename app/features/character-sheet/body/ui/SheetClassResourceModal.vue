<script setup lang="ts">
  import type { CharacterClassResource } from '../../model';

  import {
    RESOURCE_COUNT_MAX,
    RESOURCE_COUNT_MIN,
    RESOURCE_PLACEHOLDERS,
    RESOURCE_RECOVERY_AMOUNT_MIN,
    RESOURCE_RECOVERY_FIELDS,
    RESOURCE_RECOVERY_ICONS,
    RESOURCE_RECOVERY_LABELS,
    RESOURCE_RECOVERY_MODE_OPTIONS,
    RESOURCE_SHORT_LABEL_MAX_LENGTH,
    toClassResourceDraft,
  } from '../../model';

  const props = defineProps<{
    /** Заголовок окна: у добавления и правки он разный. */
    title: string;

    /** Ресурс, который правится; форма работает с его копией. */
    resource: CharacterClassResource;
  }>();

  const emit = defineEmits<{
    /** Закрытие окна; ресурс передаётся только при сохранении. */
    close: [resource?: CharacterClassResource];
  }>();

  // Форма правит копию: список ресурсов до сохранения меняться не должен.
  // Черновик живёт до закрытия — оверлей размонтирует модалку.
  const draftResource = ref<CharacterClassResource>(
    toClassResourceDraft(props.resource),
  );

  // Остаток не переживает снижение максимума: иначе в списке осталось бы «3/2».
  // Обратной связи нет (максимум от остатка не зависит), поэтому цикла тоже нет.
  watch(
    () => draftResource.value.max,
    (max) => {
      draftResource.value.current = Math.min(draftResource.value.current, max);
    },
  );

  /** Ресурс без обеих подписей стал бы на листе пустой строкой. */
  const isSaveDisabled = computed(
    () =>
      !draftResource.value.name.trim()
      && !draftResource.value.shortLabel.trim(),
  );

  /** Сохранение: ресурс уходит в список, применение к листу — уже там. */
  function handleSave() {
    emit('close', draftResource.value);
  }

  /** Закрытие без сохранения: список остаётся как был. */
  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal :title="title">
    <template #body>
      <div class="flex flex-col gap-3">
        <div class="flex items-end gap-3">
          <div class="flex min-w-0 grow flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              Название
            </span>

            <UInput
              v-model="draftResource.name"
              :placeholder="RESOURCE_PLACEHOLDERS.name"
              autofocus
            />
          </div>

          <div class="flex w-24 shrink-0 flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              Кратко
            </span>

            <UInput
              v-model="draftResource.shortLabel"
              :placeholder="RESOURCE_PLACEHOLDERS.shortLabel"
              :maxlength="RESOURCE_SHORT_LABEL_MAX_LENGTH"
            />
          </div>
        </div>

        <div class="flex items-end gap-3">
          <div class="flex w-28 shrink-0 flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              Сейчас
            </span>

            <UInputNumber
              v-model="draftResource.current"
              :min="RESOURCE_COUNT_MIN"
              :max="draftResource.max"
            />
          </div>

          <div class="flex w-28 shrink-0 flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              Максимум
            </span>

            <UInputNumber
              v-model="draftResource.max"
              :min="RESOURCE_COUNT_MIN"
              :max="RESOURCE_COUNT_MAX"
            />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-[10px] font-bold text-muted uppercase">
            Восстановление
          </span>

          <div class="grid gap-2 sm:grid-cols-2">
            <div
              v-for="field in RESOURCE_RECOVERY_FIELDS"
              :key="field.key"
              class="flex flex-col gap-1.5 rounded-md bg-elevated/40 p-2"
            >
              <span
                class="flex items-center gap-1 text-[10px] font-bold text-muted uppercase"
              >
                <UIcon
                  :name="RESOURCE_RECOVERY_ICONS[field.rest]"
                  class="size-3.5 shrink-0"
                />

                {{ RESOURCE_RECOVERY_LABELS[field.rest] }}
              </span>

              <USelect
                v-model="draftResource[field.key].mode"
                :items="RESOURCE_RECOVERY_MODE_OPTIONS"
                :aria-label="`Восстановление: ${RESOURCE_RECOVERY_LABELS[field.rest]}`"
              />

              <UInputNumber
                v-if="draftResource[field.key].mode === 'amount'"
                v-model="draftResource[field.key].amount"
                :min="RESOURCE_RECOVERY_AMOUNT_MIN"
                :max="RESOURCE_COUNT_MAX"
                :aria-label="`Сколько зарядов вернёт отдых: ${RESOURCE_RECOVERY_LABELS[field.rest]}`"
              />
            </div>
          </div>
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
          :disabled="isSaveDisabled"
          @click.left.exact.prevent="handleSave"
        />
      </div>
    </template>
  </UModal>
</template>
