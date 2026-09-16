<script setup lang="ts">
  import type { BreadcrumbItem } from '#ui/components/Breadcrumb.vue';

  import { buildBreadcrumbItems, buildBreadcrumbSchemaItems } from './utils';

  const props = defineProps<{
    /** Заголовок текущей страницы — станет последней крошкой */
    title?: string;
  }>();

  const route = useRoute();

  const breadcrumbs = computed<Array<BreadcrumbItem>>(() =>
    buildBreadcrumbItems(route.path, props.title),
  );

  const isShowed = computed(() => breadcrumbs.value.length > 1);

  // Крошки уходят в общий граф schema.org сайта, а не отдельным блоком
  // JSON-LD: так поисковик связывает их со страницей, а адреса модуль
  // достраивает до абсолютных сам.
  const schema = computed(() =>
    isShowed.value
      ? [
          defineBreadcrumb({
            itemListElement: buildBreadcrumbSchemaItems(breadcrumbs.value),
          }),
        ]
      : [],
  );

  useSchemaOrg(schema);
</script>

<template>
  <UBreadcrumb
    v-if="isShowed"
    :items="breadcrumbs"
    color="neutral"
    class="shrink-0"
    :ui="{ list: 'flex-wrap gap-x-1 gap-y-0.5' }"
  />
</template>
