<script setup lang="ts">
  import type { ClassLinkResponse } from '~classes/types';
  import type { CommandPaletteGroup } from '@nuxt/ui';
  import { uniqBy } from 'lodash-es';

  const { url, parent = undefined } = defineProps<{
    url: string;
    parent?: ClassLinkResponse;
  }>();

  const { data: subclasses, status } = await useAsyncData(
    computed(() => `class-${parent ? parent.url : url}-subclasses`),
    () =>
      $fetch<Array<ClassLinkResponse>>(
        `/api/v2/classes/${parent ? parent.url : url}/subclasses`,
      ),
    {
      server: false,
    },
  );

  const search = ref<string>();

  const isLoading = computed(() => status.value === 'pending');

  const groups = computed<Array<CommandPaletteGroup>>(() => {
    if (!subclasses.value?.length) {
      return [];
    }

    return uniqBy(
      subclasses.value.map((subclass) => subclass.source.group),
      (group) => group.label,
    ).map((group) => ({
      id: group.label,
      label: group.rus,
      items: subclasses.value
        ?.filter((subclass) => subclass.source.group.label === group.label)
        .map((subclass) => ({
          id: subclass.url,
          label: subclass.name.rus,
          suffix: subclass.name.eng ? `[${subclass.name.eng}]` : undefined,
          to: `/classes/${subclass.url}`,
        })),
    }));
  });
</script>

<template>
  <div class="flex gap-2">
    <UButton
      v-if="parent"
      :to="`/classes/${parent.url}`"
      variant="ghost"
      color="neutral"
      size="sm"
    >
      {{ parent.name.rus }}
    </UButton>

    <UPopover
      :ui="{ content: 'p-0' }"
      modal
      arrow
    >
      <template #default="{ open }">
        <UButton
          :disabled="!subclasses?.length"
          :loading="isLoading"
          :variant="'ghost'"
          :active="open"
          active-variant="soft"
          color="neutral"
          size="sm"
        >
          Подклассы

          <UBadge
            v-if="subclasses?.length"
            variant="subtle"
            color="neutral"
            size="sm"
          >
            {{ subclasses.length }}
          </UBadge>
        </UButton>
      </template>

      <template #content>
        <UCommandPalette
          v-model:search-term="search"
          placeholder="Поиск подкласса..."
          :groups
          :ui="{
            input: '[&>input]:h-8 [&>input]:text-sm',
            content: 'max-h-80',
          }"
        />
      </template>
    </UPopover>
  </div>
</template>
