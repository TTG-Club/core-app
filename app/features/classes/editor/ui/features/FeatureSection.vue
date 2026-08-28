<script setup lang="ts">
  import { InfoTooltip } from '~ui/tooltip';

  import { CLASS_FEATURES_EDITOR } from '../../../model';

  /**
   * Свёрнутый блок внутри умения: рост по уровням, варианты, механика.
   *
   * У большинства умений эти блоки пусты, а развёрнутые они заслоняли бы
   * список умений, — поэтому блок свёрнут, а в шапке показано, сколько в нём
   * записей: без пометки автор не видит, какие блоки заполнены, и раскрывает
   * их по одному.
   *
   * Содержимое лежит в общей с шапкой рамке: блоков в умении несколько подряд,
   * и без рамки развёрнутый блок читался как продолжение формы умения, а не
   * как его часть. Кнопка добавления живёт в шапке — пустому блоку хватает
   * одной строки вместо подписи «записей нет» и кнопки во всю ширину.
   */
  const {
    title,
    hint = undefined,
    count = 0,
    addLabel = undefined,
  } = defineProps<{
    title: string;

    /** Пояснение к блоку по наведению на значок в шапке. */
    hint?: string;

    /** Сколько записей в блоке; ноль — бейдж не показывается. */
    count?: number;

    /** Подпись кнопки добавления в шапке; пусто — кнопки нет. */
    addLabel?: string;
  }>();

  const emit = defineEmits<{ add: [] }>();

  const isOpen = ref(false);

  /** Значок кнопки свёртки: указывает, куда уедет содержимое блока. */
  const toggleIcon = computed(() =>
    isOpen.value ? 'tabler:chevron-up' : 'tabler:chevron-down',
  );

  /** Подпись кнопки свёртки для скринридера. */
  const toggleLabel = computed(() =>
    isOpen.value
      ? CLASS_FEATURES_EDITOR.collapseSection
      : CLASS_FEATURES_EDITOR.expandSection,
  );

  /** Разворачивает или сворачивает блок. */
  function toggle(): void {
    isOpen.value = !isOpen.value;
  }

  /** Добавление раскрывает блок: иначе новая запись легла бы в свёрнутый. */
  function add(): void {
    isOpen.value = true;

    emit('add');
  }
</script>

<template>
  <div
    class="col-span-full overflow-hidden rounded-lg border border-default bg-elevated/20"
  >
    <div class="flex items-center gap-2 px-3 py-2">
      <!-- Шапка разворачивает блок целиком: попадать значком в конце строки
        приходилось прицельно. Кнопки лежат рядом с ней, а не внутри: кнопка
        внутри кнопки недопустима -->
      <button
        type="button"
        class="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-medium text-highlighted"
        :aria-expanded="isOpen"
        @click.left.exact.prevent="toggle"
      >
        <span class="truncate">{{ title }}</span>

        <UBadge
          v-if="count"
          size="sm"
          color="primary"
          variant="subtle"
          class="shrink-0 tabular-nums"
        >
          {{ count }}
        </UBadge>
      </button>

      <InfoTooltip
        v-if="hint"
        :text="hint"
        icon="tabler:info-circle-filled"
        class="shrink-0 text-dimmed"
      />

      <UButton
        v-if="addLabel"
        icon="tabler:plus"
        :label="addLabel"
        color="primary"
        variant="soft"
        size="xs"
        class="shrink-0"
        @click.left.exact.prevent="add"
      />

      <UButton
        :icon="toggleIcon"
        color="neutral"
        variant="ghost"
        size="xs"
        :aria-label="toggleLabel"
        @click.left.exact.prevent="toggle"
      />
    </div>

    <UCollapsible v-model:open="isOpen">
      <template #content>
        <div class="border-t border-default p-3">
          <slot />
        </div>
      </template>
    </UCollapsible>
  </div>
</template>
