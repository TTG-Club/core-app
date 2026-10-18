<script setup lang="ts">
  /**
   * Карточка списка в форме сооружения: заголовок, пояснение, кнопка
   * добавления и пустой вид, пока строк нет.
   */
  defineProps<{
    title: string;
    hint: string;
    empty: string;
    addLabel: string;
    count: number;
  }>();

  defineEmits<{ add: [] }>();
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex min-w-0 flex-col">
          <h2 class="truncate text-base text-highlighted">
            {{ title }}
          </h2>

          <p class="text-xs text-muted">
            {{ hint }}
          </p>
        </div>

        <UButton
          icon="tabler:plus"
          variant="subtle"
          size="sm"
          @click.left.exact.prevent="$emit('add')"
        >
          {{ addLabel }}
        </UButton>
      </div>
    </template>

    <div class="flex flex-col gap-3">
      <p
        v-if="!count"
        class="text-sm text-dimmed italic"
      >
        {{ empty }}
      </p>

      <slot />
    </div>
  </UCard>
</template>
