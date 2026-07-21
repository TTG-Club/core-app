<script setup lang="ts">
  import { useCharacterSheet } from '../../composables';
  import {
    NEW_CLASS_RESOURCE,
    RESOURCE_COUNT_MAX,
    RESOURCE_COUNT_MIN,
    RESOURCE_RECOVERY_OPTIONS,
    RESOURCE_SHORT_LABEL_MAX_LENGTH,
    SHEET_EMPTY_LABELS,
  } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setClassResources } = useCharacterSheet();

  const draftResources = ref(
    character.value.classResources.map((resource) => ({ ...resource })),
  );

  const countLabel = computed(() => `${draftResources.value.length} шт.`);

  function handleAddResource() {
    draftResources.value.push({
      id: crypto.randomUUID(),
      ...NEW_CLASS_RESOURCE,
    });
  }

  function handleRemoveResource(resourceId: string) {
    draftResources.value = draftResources.value.filter(
      (resource) => resource.id !== resourceId,
    );
  }

  function handleApply() {
    setClassResources(draftResources.value);
    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal title="Ресурсы класса">
    <template #body>
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted">{{ countLabel }}</span>

          <UButton
            icon="tabler:plus"
            label="Добавить"
            color="neutral"
            variant="ghost"
            size="xs"
            @click.left.exact.prevent="handleAddResource"
          />
        </div>

        <div
          v-for="resource in draftResources"
          :key="resource.id"
          class="flex flex-col gap-3 rounded-lg border border-default/50 bg-elevated/20 p-3"
        >
          <div class="flex items-end gap-3">
            <div class="flex min-w-0 grow flex-col gap-1">
              <span class="text-[10px] font-bold text-muted uppercase">
                Название
              </span>

              <UInput
                v-model="resource.name"
                placeholder="Название ресурса"
              />
            </div>

            <div class="flex w-20 shrink-0 flex-col gap-1">
              <span class="text-[10px] font-bold text-muted uppercase">
                Кратко
              </span>

              <UInput
                v-model="resource.shortLabel"
                :maxlength="RESOURCE_SHORT_LABEL_MAX_LENGTH"
              />
            </div>

            <UButton
              icon="tabler:trash"
              color="error"
              variant="ghost"
              size="xs"
              square
              aria-label="Удалить ресурс"
              @click.left.exact.prevent="handleRemoveResource(resource.id)"
            />
          </div>

          <div class="flex items-end gap-3">
            <div class="flex min-w-0 grow flex-col gap-1">
              <span class="text-[10px] font-bold text-muted uppercase">
                Восстановление
              </span>

              <USelect
                v-model="resource.recovery"
                :items="RESOURCE_RECOVERY_OPTIONS"
              />
            </div>

            <div class="flex w-20 shrink-0 flex-col gap-1">
              <span class="text-[10px] font-bold text-muted uppercase">
                Сейчас
              </span>

              <UInputNumber
                v-model="resource.current"
                :min="RESOURCE_COUNT_MIN"
                :max="RESOURCE_COUNT_MAX"
              />
            </div>

            <div class="flex w-20 shrink-0 flex-col gap-1">
              <span class="text-[10px] font-bold text-muted uppercase">
                Максимум
              </span>

              <UInputNumber
                v-model="resource.max"
                :min="RESOURCE_COUNT_MIN"
                :max="RESOURCE_COUNT_MAX"
              />
            </div>
          </div>
        </div>

        <span
          v-if="!draftResources.length"
          class="text-sm text-dimmed italic"
        >
          {{ SHEET_EMPTY_LABELS.classResources }}
        </span>
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
          label="Применить"
          color="primary"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
