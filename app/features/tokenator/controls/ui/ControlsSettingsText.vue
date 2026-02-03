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
  <div class="grid gap-3 pt-2">
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
      class="grid gap-2 rounded-md bg-muted p-2"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
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
      <div class="grid gap-3">
        <!-- Color & Font Size -->
        <div class="grid grid-cols-[1fr_auto] gap-2">
          <!-- Color -->
          <div class="flex items-center gap-2">
            <UPopover
              mode="click"
              :popper="{ placement: 'bottom-start' }"
            >
              <UButton
                color="neutral"
                variant="outline"
                size="xs"
                class="flex size-6 items-center justify-center p-0"
              >
                <span
                  class="size-4 rounded-full border border-neutral-200"
                  :style="{ backgroundColor: activeText.color }"
                />
              </UButton>

              <template #content>
                <div class="p-2">
                  <UColorPicker v-model="activeText.color" />
                </div>
              </template>
            </UPopover>

            <span class="text-xs text-neutral-500">Цвет</span>
          </div>

          <!-- Font Size -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-neutral-500">Размер</span>

            <UInput
              v-model="activeText.fontSize"
              type="number"
              size="xs"
              class="w-16"
              :min="10"
              :max="200"
            />
          </div>
        </div>

        <!-- Position X -->
        <div class="space-y-1">
          <div
            class="flex items-center justify-between text-xs text-neutral-500"
          >
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
        </div>

        <!-- Position Y -->
        <div class="space-y-1">
          <div
            class="flex items-center justify-between text-xs text-neutral-500"
          >
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

        <!-- Rotation -->
        <div class="space-y-1">
          <div
            class="flex items-center justify-between text-xs text-neutral-500"
          >
            <button
              type="button"
              class="flex items-center gap-1.5 transition-colors"
              :class="
                activeText.rotation !== 0
                  ? 'cursor-pointer text-primary-500'
                  : 'cursor-default text-neutral-500'
              "
              :disabled="activeText.rotation === 0"
              title="Сбросить поворот"
              @click.left.exact.prevent="activeText.rotation = 0"
            >
              <span>Поворот</span>

              <UIcon
                v-if="activeText.rotation !== 0"
                name="i-fluent-arrow-undo-20-regular"
                class="size-3"
              />
            </button>

            <span class="font-mono">{{ activeText.rotation }}°</span>
          </div>

          <USlider
            v-model="activeText.rotation"
            :min="-180"
            :max="180"
            :step="1"
            size="xs"
          />
        </div>

        <!-- Arc -->
        <div class="space-y-1">
          <div
            class="flex items-center justify-between text-xs text-neutral-500"
          >
            <button
              type="button"
              class="flex items-center gap-1.5 transition-colors"
              :class="
                activeText.arc !== 0
                  ? 'cursor-pointer text-primary-500'
                  : 'cursor-default text-neutral-500'
              "
              :disabled="activeText.arc === 0"
              title="Сбросить изгиб"
              @click.left.exact.prevent="activeText.arc = 0"
            >
              <span>Изгиб</span>

              <UIcon
                v-if="activeText.arc !== 0"
                name="i-fluent-arrow-undo-20-regular"
                class="size-3"
              />
            </button>

            <span class="font-mono">{{ activeText.arc }}°</span>
          </div>

          <USlider
            v-model="activeText.arc"
            :min="-360"
            :max="360"
            :step="5"
            size="xs"
          />
        </div>
      </div>
    </div>

    <div
      v-else-if="store.texts.length > 0"
      class="space-y-2"
    >
      <div class="text-xs text-neutral-500">Выберите текст:</div>

      <div class="flex flex-col gap-2">
        <UButton
          v-for="text in store.texts"
          :key="text.id"
          :label="text.content"
          size="sm"
          variant="soft"
          color="neutral"
          class="justify-start truncate"
          @click.left.exact.prevent="store.activeTextId = text.id"
        />
      </div>
    </div>

    <div
      v-else
      class="py-4 text-center text-xs text-neutral-400"
    >
      Нет текстов
    </div>
  </div>
</template>
