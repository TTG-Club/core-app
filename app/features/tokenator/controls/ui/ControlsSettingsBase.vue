<script setup lang="ts">
  import { useTokenatorStore } from '~tokenator/composables';

  const store = useTokenatorStore();

  watchEffect(() => {
    if (store.transform.maskScale === undefined) {
      store.transform.maskScale = 1;
    }
  });
</script>

<template>
  <div class="space-y-3 pt-1">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        <span class="mr-1 text-xs tracking-wide text-neutral-500 uppercase">
          Отразить:
        </span>

        <UButton
          size="sm"
          color="neutral"
          variant="soft"
          :padded="false"
          class="flex h-7 w-8 items-center justify-center text-xs font-medium"
          @click.left.exact.prevent="
            store.transform.flip.x = !store.transform.flip.x
          "
        >
          X
        </UButton>

        <UButton
          size="sm"
          color="neutral"
          variant="soft"
          :padded="false"
          class="flex h-7 w-8 items-center justify-center text-xs font-medium"
          @click.left.exact.prevent="
            store.transform.flip.y = !store.transform.flip.y
          "
        >
          Y
        </UButton>
      </div>
    </div>

    <div class="space-y-4 px-1">
      <div class="space-y-1.5">
        <div class="flex h-5 items-center justify-between">
          <button
            type="button"
            class="flex items-center gap-1.5 text-xs transition-colors"
            :class="
              store.transform.maskScale !== 1
                ? 'cursor-pointer text-primary-500'
                : 'cursor-default text-neutral-500'
            "
            :disabled="store.transform.maskScale === 1"
            title="Сбросить масштаб маски"
            @click.left.exact.prevent="store.transform.maskScale = 1"
          >
            <span>Маска</span>

            <UIcon
              v-if="store.transform.maskScale !== 1"
              name="i-fluent-arrow-undo-20-regular"
              class="size-3"
            />
          </button>

          <span class="font-mono text-xs text-neutral-400">{{
            store.transform.maskScale.toFixed(2)
          }}</span>
        </div>

        <USlider
          v-model.number="store.transform.maskScale"
          size="xs"
          :min="0.5"
          :max="1.5"
          :step="0.01"
        />
      </div>

      <div class="space-y-1.5">
        <div class="flex h-5 items-center justify-between">
          <button
            type="button"
            class="flex items-center gap-1.5 text-xs transition-colors"
            :class="
              store.transform.frameScale !== 1
                ? 'cursor-pointer text-primary-500'
                : 'cursor-default text-neutral-500'
            "
            :disabled="store.transform.frameScale === 1"
            title="Сбросить масштаб рамки"
            @click.left.exact.prevent="store.transform.frameScale = 1"
          >
            <span>Рамка</span>

            <UIcon
              v-if="store.transform.frameScale !== 1"
              name="i-fluent-arrow-undo-20-regular"
              class="size-3"
            />
          </button>

          <span class="font-mono text-xs text-neutral-400">{{
            store.transform.frameScale.toFixed(2)
          }}</span>
        </div>

        <USlider
          v-model.number="store.transform.frameScale"
          size="xs"
          :min="0.5"
          :max="1.5"
          :step="0.01"
        />
      </div>

      <div class="space-y-1.5">
        <div class="flex h-5 items-center justify-between">
          <button
            type="button"
            class="flex items-center gap-1.5 text-xs transition-colors"
            :class="
              store.transform.frameRotate !== 0
                ? 'cursor-pointer text-primary-500'
                : 'cursor-default text-neutral-500'
            "
            :disabled="store.transform.frameRotate === 0"
            title="Сбросить поворот рамки"
            @click.left.exact.prevent="store.transform.frameRotate = 0"
          >
            <span>Поворот рамки</span>

            <UIcon
              v-if="store.transform.frameRotate !== 0"
              name="i-fluent-arrow-undo-20-regular"
              class="size-3"
            />
          </button>

          <span class="font-mono text-xs text-neutral-400"
            >{{ store.transform.frameRotate }}°</span
          >
        </div>

        <USlider
          v-model.number="store.transform.frameRotate"
          size="xs"
          :min="-180"
          :max="180"
          :step="1"
        />
      </div>

      <div class="space-y-1.5">
        <div class="flex h-5 items-center justify-between">
          <button
            type="button"
            class="flex items-center gap-1.5 text-xs transition-colors"
            :class="
              store.transform.scale !== 1
                ? 'cursor-pointer text-primary-500'
                : 'cursor-default text-neutral-500'
            "
            :disabled="store.transform.scale === 1"
            title="Сбросить общий масштаб"
            @click.left.exact.prevent="store.transform.scale = 1"
          >
            <span>Масштаб</span>

            <UIcon
              v-if="store.transform.scale !== 1"
              name="i-fluent-arrow-undo-20-regular"
              class="size-3"
            />
          </button>

          <span class="font-mono text-xs text-neutral-400">{{
            store.transform.scale.toFixed(2)
          }}</span>
        </div>

        <USlider
          v-model.number="store.transform.scale"
          size="xs"
          :min="0.1"
          :max="3"
          :step="0.05"
        />
      </div>

      <div class="space-y-1.5">
        <div class="flex h-5 items-center justify-between">
          <button
            type="button"
            class="flex items-center gap-1.5 text-xs transition-colors"
            :class="
              store.transform.rotate !== 0
                ? 'cursor-pointer text-primary-500'
                : 'cursor-default text-neutral-500'
            "
            :disabled="store.transform.rotate === 0"
            title="Сбросить поворот изображения"
            @click.left.exact.prevent="store.transform.rotate = 0"
          >
            <span>Поворот изображения</span>

            <UIcon
              v-if="store.transform.rotate !== 0"
              name="i-fluent-arrow-undo-20-regular"
              class="size-3"
            />
          </button>

          <span class="font-mono text-xs text-neutral-400"
            >{{ store.transform.rotate }}°</span
          >
        </div>

        <USlider
          v-model.number="store.transform.rotate"
          size="xs"
          :min="-180"
          :max="180"
          :step="1"
        />
      </div>
    </div>
  </div>
</template>
