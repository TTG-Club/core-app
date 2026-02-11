<script setup lang="ts">
  import { useFileDialog } from '@vueuse/core';
  import { useTokenatorStore } from '~tokenator/composables';

  import type { TokenatorFrame } from '~tokenator/model';

  const store = useTokenatorStore();

  const { data: bordersData } = await useAsyncData('token-borders', () =>
    $fetch<Array<TokenatorFrame>>('/api/v2/token-border'),
  );

  const frames = computed<Array<TokenatorFrame>>(() => bordersData.value ?? []);

  function useImageUpload(handler: (file: File) => void) {
    const { open, onChange } = useFileDialog({
      accept: 'image/*',
      multiple: false,
      reset: true,
    });

    onChange((files) => {
      if (files?.[0]) {
        handler(files[0]);
      }
    });

    return open;
  }

  const openImageUpload = useImageUpload(store.setImage);
  const openFrameUpload = useImageUpload(store.setCustomFrame);
  const openBgUpload = useImageUpload(store.setCustomBackground);

  watch(
    frames,
    (newFrames) => {
      if (
        newFrames?.length &&
        newFrames[0] &&
        !store.currentFrame &&
        !store.customFrame
      ) {
        store.selectFrame(newFrames[0]);
      }
    },
    { immediate: true },
  );

  function getFrameButtonClass(id: string) {
    return store.currentFrame?.id === id ? 'border-primary' : 'border-default';
  }
</script>

<template>
  <div class="grid gap-6">
    <div class="grid gap-2 pt-4">
      <div class="col-span-2">
        <UFieldGroup
          v-if="store.currentImage"
          class="flex w-full"
          orientation="horizontal"
        >
          <UButton
            color="neutral"
            variant="outline"
            class="flex-1 justify-center rounded-r-none px-1"
            :ui="{ leadingIcon: 'mr-1' }"
            label="Изображение"
            @click.left.exact.prevent="openImageUpload()"
          />

          <UButton
            color="neutral"
            variant="outline"
            icon="i-ttg-x"
            class="rounded-l-none border-l-0 px-2"
            @click.stop="store.currentImage = null"
          />
        </UFieldGroup>

        <UButton
          v-else
          block
          color="neutral"
          variant="outline"
          label="Изображение"
          @click.left.exact.prevent="openImageUpload()"
        />
      </div>

      <div>
        <UFieldGroup
          v-if="store.customFrame"
          class="flex w-full"
          orientation="horizontal"
        >
          <UButton
            color="neutral"
            variant="outline"
            class="flex-1 justify-center rounded-r-none px-1"
            :ui="{ leadingIcon: 'mr-1' }"
            label="Рамка"
            @click.left.exact.prevent="openFrameUpload()"
          />

          <UButton
            color="neutral"
            variant="outline"
            icon="i-ttg-x"
            class="rounded-l-none border-l-0 px-2"
            @click.stop="store.customFrame = null"
          />
        </UFieldGroup>

        <UButton
          v-else
          block
          color="neutral"
          variant="outline"
          label="Рамка"
          @click.left.exact.prevent="openFrameUpload()"
        />
      </div>

      <div>
        <UFieldGroup
          v-if="store.customBackground"
          class="flex w-full"
          orientation="horizontal"
        >
          <UButton
            color="neutral"
            variant="outline"
            class="flex-1 justify-center rounded-r-none px-1"
            :ui="{ leadingIcon: 'mr-1' }"
            label="Фон"
            @click.left.exact.prevent="openBgUpload()"
          />

          <UButton
            color="neutral"
            variant="outline"
            icon="i-ttg-x"
            class="rounded-l-none border-l-0 px-2"
            @click.stop="store.customBackground = null"
          />
        </UFieldGroup>

        <UButton
          v-else
          block
          color="neutral"
          variant="outline"
          label="Фон"
          @click.left.exact.prevent="openBgUpload()"
        />
      </div>
    </div>

    <div
      v-if="frames && frames.length"
      :class="[
        'scrollbar-thin -my-2 max-h-48 overflow-x-hidden overflow-y-auto',
        'mask-[linear-gradient(to_bottom,transparent,black_8px,black_calc(100%-8px),transparent)]',
      ]"
    >
      <div class="grid grid-cols-5 gap-2 py-2">
        <button
          :class="[
            store.isNoFrameSelected ? 'border-primary text-primary' : '',
            'flex aspect-square items-center justify-center',
            'cursor-pointer overflow-hidden rounded-md p-1',
            'border-2 border-dashed border-neutral-300 text-neutral-400',
            'transition-all hover:hover:border-primary hover:text-primary',
          ]"
          @click.left.exact.prevent="store.selectNoFrame"
        >
          <UIcon
            name="i-ttg-x"
            class="size-6"
          />
        </button>

        <button
          v-for="frame in frames"
          :key="frame.id"
          :class="[
            getFrameButtonClass(frame.id),
            'flex aspect-square items-center justify-center',
            'cursor-pointer overflow-hidden rounded-md border-2 p-1',
            'transition-all hover:border-primary-500/50',
          ]"
          @click.left.exact.prevent="store.selectFrame(frame)"
        >
          <img
            :src="frame.url"
            alt="Рамка"
            class="block size-full object-contain"
            loading="lazy"
          />
        </button>
      </div>
    </div>

    <div
      v-else
      class="py-4 text-center text-sm text-neutral-400"
    >
      Нет доступных рамок
    </div>

    <UButton
      icon="i-fluent-arrow-reset-24-regular"
      label="Сбросить все изображения"
      variant="soft"
      color="error"
      block
      @click.left.exact.prevent="store.resetLibrarySettings"
    />
  </div>
</template>
