<script setup lang="ts">
  import type { CreateCodesRequest, RedemptionCodeResponse } from '../model';

  import { UiDetailPane } from '~ui/detail-pane';

  import CodeDetailPane from './CodeDetailPane.vue';
  import CreateCodesForm from './CreateCodesForm.vue';

  defineProps<{
    createMode: boolean;
    code: RedemptionCodeResponse | null;
    submitting?: boolean;
  }>();

  const emit = defineEmits<{
    submit: [payload: CreateCodesRequest];
    updated: [code: RedemptionCodeResponse];
    close: [];
  }>();
</script>

<template>
  <!-- Создание кода -->
  <UiDetailPane
    v-if="createMode"
    title="Новый код"
    @close="emit('close')"
  >
    <CreateCodesForm
      :loading="submitting"
      @submit="(payload) => emit('submit', payload)"
    />
  </UiDetailPane>

  <!-- Деталь выбранного кода -->
  <CodeDetailPane
    v-else-if="code"
    :code="code"
    @close="emit('close')"
    @updated="(updated) => emit('updated', updated)"
  />

  <!-- Ничего не выбрано -->
  <div
    v-else
    class="flex h-full w-full flex-col items-center justify-center p-6 text-center select-none"
  >
    <div class="flex max-w-xs flex-col items-center gap-3">
      <UIcon
        name="tabler:ticket"
        class="size-10 text-muted/40"
      />

      <h3 class="text-lg font-semibold text-highlighted">Код не выбран</h3>

      <p class="text-sm text-secondary">
        Выберите код из списка слева или создайте новый.
      </p>
    </div>
  </div>
</template>
