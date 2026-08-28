<script setup lang="ts">
  import { InfoTooltip } from '~ui/tooltip';

  /**
   * Свёрнутый блок внутри умения: рост по уровням, варианты, механика.
   *
   * У большинства умений эти блоки пусты, а развёрнутые они заслоняли бы
   * список умений, — поэтому блок свёрнут, а в шапке показано, сколько в нём
   * записей: без пометки автор не видит, какие блоки заполнены, и раскрывает
   * их по одному.
   */
  const {
    title,
    hint = undefined,
    count = 0,
  } = defineProps<{
    title: string;

    /** Пояснение к блоку по наведению на заголовок. */
    hint?: string;

    /** Сколько записей в блоке; ноль — бейдж не показывается. */
    count?: number;
  }>();
</script>

<template>
  <UCollapsible class="col-span-full">
    <UButton
      class="w-full"
      color="neutral"
      variant="subtle"
      trailing-icon="tabler:chevron-down"
    >
      <InfoTooltip
        v-if="hint"
        :text="hint"
        icon="tabler:info-circle-filled"
        class="min-w-0"
      >
        <span class="truncate">{{ title }}</span>
      </InfoTooltip>

      <span
        v-else
        class="truncate"
      >
        {{ title }}
      </span>

      <template #trailing>
        <UBadge
          v-if="count"
          size="sm"
          color="primary"
          variant="subtle"
        >
          {{ count }}
        </UBadge>

        <UIcon name="tabler:chevron-down" />
      </template>
    </UButton>

    <template #content>
      <div class="pt-3">
        <slot />
      </div>
    </template>
  </UCollapsible>
</template>
