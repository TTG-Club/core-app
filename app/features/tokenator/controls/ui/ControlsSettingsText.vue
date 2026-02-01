<script setup lang="ts">
  import { useTokenatorStore } from '~tokenator/composables';

  import type { TokenText } from '~tokenator/model';

  const store = useTokenatorStore();
  const textInput = ref('');

  const activeText = computed<TokenText | undefined>(() =>
    store.texts.find((t) => t.id === store.activeTextId),
  );

  function addNewText() {
    if (!textInput.value.trim()) {
      return;
    }

    store.addText(textInput.value);
    textInput.value = '';
  }
</script>

<template>
  <div class="space-y-4 px-1 pt-1">
    <div class="flex gap-2">
      <UInput
        v-model="textInput"
        placeholder="Введите текст"
        class="flex-1"
        size="sm"
        @keyup.enter="addNewText"
      />

      <UButton
        label="Добавить"
        size="sm"
        :disabled="!textInput.trim()"
        @click.left.exact.prevent="addNewText"
      />
    </div>

    <div
      v-if="activeText"
      class="space-y-3 rounded-md bg-muted p-2"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UButton
            icon="i-fluent-arrow-left-20-regular"
            variant="ghost"
            size="xs"
            :padded="false"
            title="Назад к списку"
            @click.left.exact.prevent="store.activeTextId = null"
          />

          <span
            class="max-w-[120px] truncate text-xs font-medium text-primary-500"
            >{{ activeText.content }}</span
          >
        </div>

        <UButton
          icon="i-fluent-delete-20-regular"
          color="error"
          variant="ghost"
          size="xs"
          :padded="false"
          @click.left.exact.prevent="store.removeText(activeText.id)"
        />
      </div>

      <!-- Position -->
      <div class="space-y-2">
        <div class="flex items-center justify-between text-xs text-neutral-500">
          <button
            type="button"
            class="flex items-center gap-1.5 transition-colors"
            :class="
              activeText.x !== 0
                ? 'cursor-pointer text-primary-500'
                : 'cursor-default text-neutral-500'
            "
            :disabled="activeText.x === 0"
            title="Сбросить X"
            @click.left.exact.prevent="activeText.x = 0"
          >
            <span>Позиция X</span>

            <UIcon
              v-if="activeText.x !== 0"
              name="i-fluent-arrow-undo-20-regular"
              class="size-3"
            />
          </button>

          <span class="font-mono">{{ activeText.x }}</span>
        </div>

        <USlider
          v-model="activeText.x"
          :min="-250"
          :max="250"
          :step="1"
          size="xs"
        />

        <div class="flex items-center justify-between text-xs text-neutral-500">
          <button
            type="button"
            class="flex items-center gap-1.5 transition-colors"
            :class="
              activeText.y !== 0
                ? 'cursor-pointer text-primary-500'
                : 'cursor-default text-neutral-500'
            "
            :disabled="activeText.y === 0"
            title="Сбросить Y"
            @click.left.exact.prevent="activeText.y = 0"
          >
            <span>Позиция Y</span>

            <UIcon
              v-if="activeText.y !== 0"
              name="i-fluent-arrow-undo-20-regular"
              class="size-3"
            />
          </button>

          <span class="font-mono">{{ activeText.y }}</span>
        </div>

        <USlider
          v-model="activeText.y"
          :min="-250"
          :max="250"
          :step="1"
          size="xs"
        />
      </div>
    </div>
  </div>
</template>
