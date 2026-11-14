<script setup lang="ts">
  import type {
    CodeContentFormState,
    CreateCodesFormState,
    CreateCodesRequest,
  } from '../model';

  import {
    CODES_BATCH_MAX,
    CODES_BATCH_MIN,
    createCodesSchema,
    getInitialCreateCodesForm,
    hasCodeContent,
    toCreateCodesRequest,
  } from '../model';
  import CodeContentFields from './CodeContentFields.vue';

  defineProps<{
    loading?: boolean;
  }>();

  const emit = defineEmits<{
    submit: [payload: CreateCodesRequest];
  }>();

  const toast = useToast();

  const state = reactive<CreateCodesFormState>(getInitialCreateCodesForm());

  const contentFields = useTemplateRef('contentFields');

  // Состояние формы — надмножество полей содержимого, поэтому отдаём его как есть.
  const content = computed<CodeContentFormState>({
    get: () => state,
    set: (value) => {
      Object.assign(state, value);
    },
  });

  /** Возвращает форму к начальному состоянию вместе с недописанным достижением. */
  function resetForm(): void {
    Object.assign(state, getInitialCreateCodesForm());
    contentFields.value?.resetDraft();
  }

  /** Проверяет, что код не пустой, и отдаёт тело запроса на выпуск. */
  function onSubmit(): void {
    // Тир необязателен, но код должен нести хотя бы что-то одно.
    if (!hasCodeContent(state)) {
      toast.add({
        title: 'Пустой код',
        description: 'Укажите хотя бы тир, подписку, перки или достижения',
        color: 'warning',
      });

      return;
    }

    emit('submit', toCreateCodesRequest(state));
  }
</script>

<template>
  <UForm
    :state="state"
    :schema="createCodesSchema"
    class="space-y-6"
    @submit="onSubmit"
  >
    <!-- Что получит активировавший код -->
    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="tabler:gift"
            class="size-5 text-primary"
          />

          <h3 class="font-semibold text-highlighted">Содержимое кода</h3>
        </div>
      </template>

      <CodeContentFields
        ref="contentFields"
        v-model="content"
      />
    </UCard>

    <!-- Партия -->
    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="tabler:stack-2"
            class="size-5 text-primary"
          />

          <h3 class="font-semibold text-highlighted">Партия</h3>
        </div>
      </template>

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField
          label="Количество кодов"
          name="count"
        >
          <UInputNumber
            v-model="state.count"
            :min="CODES_BATCH_MIN"
            :max="CODES_BATCH_MAX"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Метка"
          name="label"
          help="Пометка для админки, в код не попадает."
        >
          <UInput
            v-model="state.label"
            placeholder="Kickstarter, тир 4"
            class="w-full"
          />
        </UFormField>
      </div>
    </UCard>

    <div class="flex justify-end gap-2">
      <UButton
        type="button"
        variant="ghost"
        color="neutral"
        icon="tabler:restore"
        @click.left.exact.prevent="resetForm"
      >
        Сбросить
      </UButton>

      <UButton
        type="submit"
        icon="tabler:ticket"
        :loading="loading"
      >
        Выпустить коды
      </UButton>
    </div>
  </UForm>
</template>
