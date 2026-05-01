<script setup lang="ts">
  import type { ClassLinkResponse } from '~classes/model';

  import {
    SELECT_DROPDOWN_DEBOUNCE_MS,
    SUBCLASS_SELECT_BASE_KEY,
    SUBCLASS_SELECT_MULTIPLE_PLACEHOLDER_SUFFIX,
    SUBCLASS_SELECT_PLACEHOLDER,
    SUBCLASSES_BY_CLASS_ENDPOINT_PREFIX,
    SUBCLASSES_BY_CLASS_ENDPOINT_SUFFIX,
    SUBCLASSES_ENDPOINT,
  } from './constants';

  interface SubclassSelectItem {
    description: string;
    label: string;
    source: string;
    value: string;
  }

  const props = withDefaults(
    defineProps<{
      classUrl?: string;
      disabled?: boolean;
      multiple?: boolean;
    }>(),
    {
      classUrl: undefined,
      disabled: false,
      multiple: false,
    },
  );

  const model = defineModel<string | Array<string>>();

  const fetchKey = computed(() => {
    if (props.classUrl) {
      return `${SUBCLASS_SELECT_BASE_KEY}-${props.classUrl}`;
    }

    return SUBCLASS_SELECT_BASE_KEY;
  });

  function fetchSubclassLinks(): Promise<Array<ClassLinkResponse>> {
    if (props.classUrl) {
      return $fetch<Array<ClassLinkResponse>>(
        `${SUBCLASSES_BY_CLASS_ENDPOINT_PREFIX}/${props.classUrl}${SUBCLASSES_BY_CLASS_ENDPOINT_SUFFIX}`,
        { method: 'get' },
      );
    }

    return $fetch<Array<ClassLinkResponse>>(SUBCLASSES_ENDPOINT, {
      method: 'get',
    });
  }

  const { data, status, refresh } = await useAsyncData<SubclassSelectItem[]>(
    fetchKey,
    async () => {
      const classLinks = await fetchSubclassLinks();

      return classLinks.map((classLink) => ({
        label: classLink.name.rus,
        value: classLink.url,
        description: classLink.name.eng,
        source: classLink.source.name.label,
      }));
    },
    {
      dedupe: 'defer',
      lazy: true,
      watch: [() => props.classUrl],
    },
  );

  const handleDropdownOpening = useDebounceFn(async (state: boolean) => {
    if (!state) {
      return;
    }

    await refresh();
  }, SELECT_DROPDOWN_DEBOUNCE_MS);

  const placeholder = computed(() => {
    if (props.multiple) {
      return `${SUBCLASS_SELECT_PLACEHOLDER}${SUBCLASS_SELECT_MULTIPLE_PLACEHOLDER_SUFFIX}`;
    }

    return SUBCLASS_SELECT_PLACEHOLDER;
  });
</script>

<template>
  <USelectMenu
    v-model="model"
    :loading="status === 'pending'"
    :items="data"
    :multiple="props.multiple"
    :disabled="props.disabled"
    :placeholder="placeholder"
    label-key="label"
    value-key="value"
    clearable
    searchable
    :ui="{ itemDescription: 'text-xs text-secondary' }"
    @update:open="handleDropdownOpening"
  >
    <template #item-trailing="{ item }">
      <UBadge
        variant="subtle"
        color="neutral"
      >
        {{ item.source }}
      </UBadge>
    </template>
  </USelectMenu>
</template>
