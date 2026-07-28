<script setup lang="ts">
  import type { ClassOption } from '../../model';

  import { ClassDrawer } from '~classes/drawer';

  import { LEVEL_UP_WIZARD_LABELS } from '../../model';
  import SheetSearchInput from './SheetSearchInput.vue';

  const {
    options,
    isLoading = false,
    hasError = false,
  } = defineProps<{
    /** Подклассы, разрешённые источниками профиля. */
    options: ClassOption[];

    isLoading?: boolean;

    /** Список загрузить не удалось — выбор можно сделать позже. */
    hasError?: boolean;
  }>();

  const selectedUrl = defineModel<string | null>({ default: null });

  const overlay = useOverlay();

  // Дровер описания подкласса с сайта; без destroyOnClose — повторный open()
  // после закрытия иначе падает («Overlay not found»).
  const subclassPreviewDrawer = overlay.create(ClassDrawer, {
    props: {
      url: '',
      onClose: () => subclassPreviewDrawer.close(),
    },
  });

  const searchTerm = ref('');

  const displayRows = computed(() => {
    const query = searchTerm.value.trim().toLowerCase();

    const filtered = query
      ? options.filter((option) => option.name.toLowerCase().includes(query))
      : options;

    return filtered.map((option) => {
      const isSelected = selectedUrl.value === option.url;

      return {
        ...option,
        isSelected,
        rowClass: isSelected ? 'bg-elevated' : '',
      };
    });
  });

  const isEmptyVisible = computed(
    () => !isLoading && !hasError && !displayRows.value.length,
  );

  function handleSelect(subclassUrl: string) {
    selectedUrl.value = subclassUrl;
  }

  function handlePreview(subclassUrl: string) {
    subclassPreviewDrawer.open({ url: subclassUrl });
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-[10px] font-bold tracking-wider text-muted uppercase">
      {{ LEVEL_UP_WIZARD_LABELS.subclassTitle }}
    </span>

    <SheetSearchInput
      v-model="searchTerm"
      :placeholder="LEVEL_UP_WIZARD_LABELS.subclassSearchPlaceholder"
    />

    <div
      v-if="isLoading"
      class="flex justify-center py-6"
    >
      <UIcon
        name="tabler:loader-2"
        class="size-5 animate-spin text-muted"
      />
    </div>

    <span
      v-else-if="hasError"
      class="px-3 py-2 text-xs text-warning"
    >
      {{ LEVEL_UP_WIZARD_LABELS.subclassError }}
    </span>

    <div
      v-else
      class="flex max-h-64 flex-col gap-1 overflow-y-auto pr-1"
    >
      <div
        v-for="subclass in displayRows"
        :key="subclass.url"
        class="relative flex items-center gap-1 rounded-md pr-2 transition-colors hover:bg-elevated/60"
        :class="subclass.rowClass"
      >
        <button
          type="button"
          class="flex min-w-0 grow cursor-pointer items-center px-3 py-1.5 text-left after:absolute after:inset-0 after:cursor-pointer"
          :aria-label="`Выбрать подкласс: ${subclass.name}`"
          @click.left.exact.prevent="handleSelect(subclass.url)"
        >
          <span class="grow truncate text-sm text-toned">
            {{ subclass.name }}
          </span>
        </button>

        <UBadge
          v-if="subclass.sourceLabel"
          size="sm"
          color="neutral"
          variant="subtle"
          class="relative z-10 shrink-0"
        >
          {{ subclass.sourceLabel }}
        </UBadge>

        <UTooltip :text="LEVEL_UP_WIZARD_LABELS.subclassPreviewTooltip">
          <UButton
            icon="tabler:layout-sidebar-right-expand"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            class="relative z-10 shrink-0"
            :aria-label="`Описание подкласса: ${subclass.name}`"
            @click.left.exact.prevent="handlePreview(subclass.url)"
          />
        </UTooltip>

        <UIcon
          v-if="subclass.isSelected"
          name="tabler:check"
          class="size-4 shrink-0 text-warning"
        />
      </div>

      <span
        v-if="isEmptyVisible"
        class="px-3 py-4 text-center text-sm text-dimmed"
      >
        {{ LEVEL_UP_WIZARD_LABELS.subclassEmpty }}
      </span>
    </div>

    <span class="text-xs text-dimmed">
      {{ LEVEL_UP_WIZARD_LABELS.subclassHint }}
    </span>
  </div>
</template>
