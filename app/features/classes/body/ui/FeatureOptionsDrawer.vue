<script setup lang="ts">
  import type { RenderNode } from '~ui/markup';

  import type { ClassFeature, ClassFeatureOption } from '../../model';

  import { MarkupRender } from '~ui/markup';

  import { FEATURE_OPTIONS_LABELS } from './constants';

  const props = defineProps<{
    feature: ClassFeature;
    title: string;
  }>();

  const opened = defineModel<boolean>({ required: true });

  const searchQuery = ref('');

  /**
   * Возвращает текстовое содержимое узла разметки для локального поиска.
   */
  function getRenderNodeText(renderNode: RenderNode | undefined): string {
    if (!renderNode) {
      return '';
    }

    if (typeof renderNode === 'string') {
      return renderNode;
    }

    if (Array.isArray(renderNode)) {
      return renderNode.map(getRenderNodeText).join(' ');
    }

    if ('text' in renderNode) {
      return renderNode.text;
    }

    if ('content' in renderNode) {
      return renderNode.content?.map(getRenderNodeText).join(' ') ?? '';
    }

    return '';
  }

  /**
   * Собирает поисковую строку по русскому и английскому названию опции.
   */
  function getOptionSearchText(option: ClassFeatureOption): string {
    return [
      option.name.rus,
      option.name.eng,
      getRenderNodeText(option.additional),
      getRenderNodeText(option.prerequisite),
      getRenderNodeText(option.description),
    ].join(' ');
  }

  /**
   * Нормализует строку для поиска без учета регистра.
   */
  function normalizeSearchText(value: string): string {
    return value.trim().toLocaleLowerCase();
  }

  const options = computed(() => props.feature.options ?? []);

  const filteredOptions = computed(() => {
    const normalizedSearchQuery = normalizeSearchText(searchQuery.value);

    if (!normalizedSearchQuery) {
      return options.value;
    }

    return options.value.filter((option) =>
      normalizeSearchText(getOptionSearchText(option)).includes(
        normalizedSearchQuery,
      ),
    );
  });

  const title = computed(() => props.title);

  const shownLabel = computed(
    () =>
      `${FEATURE_OPTIONS_LABELS.shown} ${filteredOptions.value.length} / ${options.value.length}`,
  );

  /**
   * Очищает поисковую строку.
   */
  function clearSearchQuery() {
    searchQuery.value = '';
  }
</script>

<template>
  <USlideover
    v-model:open="opened"
    :title
    :description="shownLabel"
    :ui="{
      content: 'w-full max-w-192 min-w-80',
      body: 'flex flex-col gap-4 p-4 sm:p-6',
    }"
  >
    <template #body>
      <UInput
        v-model="searchQuery"
        :placeholder="FEATURE_OPTIONS_LABELS.search"
        icon="tabler:search"
        allow-clear
        :ui="{ trailing: 'pe-0.5' }"
      >
        <template
          v-if="searchQuery"
          #trailing
        >
          <UButton
            icon="tabler:x"
            variant="link"
            color="neutral"
            size="sm"
            @click.left.exact.prevent="clearSearchQuery"
          />
        </template>
      </UInput>

      <div
        v-if="filteredOptions.length"
        class="flex flex-col gap-3"
      >
        <article
          v-for="option in filteredOptions"
          :key="option.key"
          class="rounded-lg border border-default bg-muted p-4"
        >
          <header class="mb-3 flex flex-wrap items-start gap-2">
            <div class="min-w-0 flex-1">
              <h5 class="text-base font-semibold text-highlighted">
                {{ option.name.rus }}
              </h5>

              <p
                v-if="option.name.eng"
                class="text-sm text-muted"
              >
                {{ option.name.eng }}
              </p>
            </div>

            <UBadge
              v-if="option.requiredClassLevel"
              color="neutral"
              variant="subtle"
              size="sm"
            >
              {{ option.requiredClassLevel
              }}{{ FEATURE_OPTIONS_LABELS.levelSuffix }}
            </UBadge>
          </header>

          <div
            v-if="option.prerequisite"
            class="mb-3 flex flex-wrap items-baseline gap-x-1 border-l-2 border-default pl-3 text-sm text-muted"
            :class="$style.prerequisite"
          >
            <span class="font-semibold text-highlighted">
              {{ FEATURE_OPTIONS_LABELS.prerequisite }}
            </span>

            <MarkupRender :render-node="option.prerequisite" />
          </div>

          <div
            v-if="option.additional"
            class="mb-3 text-sm text-muted italic"
          >
            <MarkupRender :render-node="option.additional" />
          </div>

          <MarkupRender :render-node="option.description" />
        </article>
      </div>

      <div
        v-else
        class="rounded-lg border border-dashed border-default bg-muted p-6 text-center text-sm text-muted"
      >
        {{ FEATURE_OPTIONS_LABELS.empty }}
      </div>
    </template>
  </USlideover>
</template>

<style module lang="scss">
  .prerequisite {
    :deep(p) {
      display: inline;
      margin-bottom: 0;
    }
  }
</style>
