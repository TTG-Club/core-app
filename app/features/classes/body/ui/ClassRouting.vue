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

  const route = useRoute();

  const currentSlug = computed<string>(() => {
    const byParam = (route.params as Record<string, string | undefined>)?.url;

    if (byParam) {
      return byParam;
    }

    const path = route.path || '';
    const last = path.split('/').filter(Boolean).pop();

    return last || '';
  });

  const selectedSubclass = computed(() =>
    subclasses.value?.find((subclass) => subclass.url === currentSlug.value),
  );

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
  <div class="flex w-auto gap-2 rounded-lg bg-accented p-1">
    <UButton
      v-if="parent"
      :to="`/classes/${parent.url}`"
      variant="ghost"
      color="neutral"
      size="md"
    >
      <div class="flex flex-col items-start leading-tight">
        <span class="text-xs text-secondary">Открыть класс:</span>

        <span>{{ parent.name.rus }}</span>
      </div>
    </UButton>

    <USeparator
      orientation="vertical"
      class="h-auto"
    />

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
          size="md"
          class="gap-4"
        >
          <div class="flex flex-col items-start leading-tight">
            <span class="text-left text-xs text-secondary"
              >Выбрать подкласс:</span
            >

            <span class="text-left">
              {{ selectedSubclass?.name?.rus || 'Выбрать' }}
            </span>
          </div>

          <UBadge
            v-if="subclasses?.length"
            variant="subtle"
            color="neutral"
            size="md"
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
          @update:model-value="() => (search = '')"
        />
      </template>
    </UPopover>

    <USeparator
      orientation="vertical"
      class="hidden h-auto md:block"
    />

    <UButton
      v-if="parent"
      :to="`/classes/`"
      variant="ghost"
      color="neutral"
      size="md"
      class="ml-auto hidden md:block"
    >
      <div class="flex flex-col items-end leading-tight">
        <span class="text-xs text-secondary">О классе</span>

        <span>Описание</span>
      </div>
    </UButton>
  </div>
</template>
