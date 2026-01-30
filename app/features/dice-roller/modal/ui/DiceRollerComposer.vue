<script setup lang="ts">
  import { useFocus } from '@vueuse/core';
  import { useDiceRollerState } from '~dice-roller/composables';

  const emit = defineEmits<{
    (e: 'submit'): void;
  }>();

  const { formula } = useDiceRollerState();

  const state = reactive({
    formula,
  });

  const inputRef = useTemplateRef<{
    input?: HTMLInputElement;
    $el: HTMLElement;
  }>('inputRef');

  const inputElement = computed(() => {
    const component = inputRef.value;

    return component?.input || component?.$el?.querySelector('input');
  });

  const { focused } = useFocus(inputElement, {
    initialValue: true,
  });

  async function onSubmit() {
    emit('submit');

    focused.value = true;

    await nextTick();

    focused.value = true;
  }
</script>

<template>
  <UForm
    :state="state"
    class="flex shrink-0 items-center gap-2 border-t border-default p-4"
    @submit.prevent="onSubmit"
  >
    <UFieldGroup class="w-full">
      <UInput
        ref="inputRef"
        v-model="state.formula"
        placeholder="Например: 1к20+5"
        class="w-full"
        @keydown.enter.prevent="onSubmit"
      >
        <template
          v-if="state.formula?.length"
          #trailing
        >
          <UButton
            color="neutral"
            variant="link"
            size="sm"
            icon="i-fluent-dismiss-circle-20-filled"
            :padded="false"
            @click.left.exact.prevent="state.formula = ''"
          />
        </template>
      </UInput>

      <slot name="help" />
    </UFieldGroup>

    <UButton
      type="button"
      icon="i-fluent-send-24-filled"
      color="primary"
      class="rounded-md shadow-lg transition"
      aria-label="Бросить кубы"
      tabindex="-1"
      @click.left.exact.prevent="onSubmit"
      @mousedown.prevent
    />
  </UForm>
</template>
