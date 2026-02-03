<script setup lang="ts">
  import { useTokenatorStore } from '~tokenator/composables';

  import type { TokenatorFrame } from '~tokenator/model';

  const store = useTokenatorStore();

  const { data: bordersData } = await useAsyncData('token-borders', () =>
    $fetch<Array<TokenatorFrame>>('/api/v2/token-border'),
  );

  const frames = computed<Array<TokenatorFrame>>(() =>
    (bordersData.value ?? []).map((border) => {
      let url = border.url;

      if (url.startsWith('http')) {
        const match = url.match(/(token-borders\/|tokenator\/)(.+)/);

        if (match) {
          url = `/s3/${match[0]}`;
        }
      }

      return {
        ...border,
        url,
      };
    }),
  );

  const imageInput = ref<HTMLInputElement | null>(null);
  const frameInput = ref<HTMLInputElement | null>(null);
  const bgInput = ref<HTMLInputElement | null>(null);

  function onImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      store.setImage(file);
      input.value = '';
    }
  }

  function onFrameUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      store.setCustomFrame(file);
      input.value = '';
    }
  }

  function onBgUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      store.setCustomBackground(file);
      input.value = '';
    }
  }

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
</script>

<template>
  <div class="grid gap-6">
    <div class="grid gap-2 pt-4">
      <div class="col-span-2">
        <input
          ref="imageInput"
          type="file"
          class="hidden"
          accept="image/*"
          @change="onImageUpload"
        />

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
            @click.left.exact.prevent="imageInput?.click()"
          />

          <UButton
            color="neutral"
            variant="outline"
            icon="i-ttg-x"
            class="rounded-l-none border-l-0 px-2"
            @click.left.exact.prevent.stop="store.currentImage = null"
          />
        </UFieldGroup>

        <UButton
          v-else
          block
          color="neutral"
          variant="outline"
          label="Изображение"
          @click.left.exact.prevent="imageInput?.click()"
        />
      </div>

      <div>
        <input
          ref="frameInput"
          type="file"
          class="hidden"
          accept="image/*"
          @change="onFrameUpload"
        />

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
            @click.left.exact.prevent="frameInput?.click()"
          />

          <UButton
            color="neutral"
            variant="outline"
            icon="i-ttg-x"
            class="rounded-l-none border-l-0 px-2"
            @click.left.exact.prevent.stop="store.customFrame = null"
          />
        </UFieldGroup>

        <UButton
          v-else
          block
          color="neutral"
          variant="outline"
          label="Рамка"
          @click.left.exact.prevent="frameInput?.click()"
        />
      </div>

      <div>
        <input
          ref="bgInput"
          type="file"
          class="hidden"
          accept="image/*"
          @change="onBgUpload"
        />

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
            @click.left.exact.prevent="bgInput?.click()"
          />

          <UButton
            color="neutral"
            variant="outline"
            icon="i-ttg-x"
            class="rounded-l-none border-l-0 px-2"
            @click.left.exact.prevent.stop="store.customBackground = null"
          />
        </UFieldGroup>

        <UButton
          v-else
          block
          color="neutral"
          variant="outline"
          label="Фон"
          @click.left.exact.prevent="bgInput?.click()"
        />
      </div>
    </div>

    <div
      v-if="frames && frames.length"
      class="scrollbar-thin max-h-[200px] overflow-x-hidden overflow-y-auto"
    >
      <div class="grid grid-cols-5 gap-2">
        <button
          class="flex aspect-square items-center justify-center rounded-md border-2 border-dashed border-neutral-300 text-neutral-400 hover:border-primary hover:text-primary"
          :class="
            !store.currentFrame && !store.customFrame
              ? 'border-primary text-primary'
              : ''
          "
          @click.left.exact.prevent="
            store.currentFrame = null;
            store.customFrame = null;
          "
        >
          <UIcon
            name="i-ttg-x"
            class="size-6"
          />
        </button>

        <button
          v-for="frame in frames"
          :key="frame.id"
          class="relative aspect-square overflow-hidden rounded-md border-2 p-1 transition-all hover:border-primary-500/50"
          :class="
            store.currentFrame?.id === frame.id
              ? 'border-primary'
              : 'border-default'
          "
          @click.left.exact.prevent="store.selectFrame(frame)"
        >
          <img
            :src="frame.url"
            alt="Рамка"
            class="size-full object-contain"
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
