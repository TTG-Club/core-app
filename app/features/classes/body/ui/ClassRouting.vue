<script setup lang="ts">
  import type { ClassLinkResponse } from '~classes/types';
  import type { CommandPaletteGroup } from '@nuxt/ui';
  import { uniqBy } from 'lodash-es';
  import type { NameResponse } from '~/shared/types';

  const {
    url,
    name,
    parent = undefined,
  } = defineProps<{
    url: string;
    name: Pick<NameResponse, 'rus' | 'eng'>;
    parent?: ClassLinkResponse;
    hasDescription?: boolean;
  }>();

  const { data: subclasses, status } = await useAsyncData(
    computed(() => `class-${parent ? parent.url : url}-subclasses`),
    () =>
      $fetch<Array<ClassLinkResponse>>(
        `/api/v2/classes/${parent ? parent.url : url}/subclasses`,
      ),
  );

  const { scrollToAnchor } = useAnchorScroll();

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
  <div class="flex w-auto gap-2">
    <UButton
      :to="`/classes/${parent ? parent.url : url}`"
      variant="soft"
      color="secondary"
      size="md"
    >
      <div class="flex flex-col items-start leading-tight">
        <span class="text-xs text-secondary"> Класс: </span>

        <span>{{ parent ? parent.name.rus : name.rus }}</span>
      </div>
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
          :variant="'soft'"
          :active="open"
          active-variant="soft"
          color="primary"
          class="gap-2"
          size="md"
        >
          <UBadge
            v-if="subclasses?.length"
            variant="subtle"
            color="primary"
            size="lg"
          >
            {{ subclasses.length }}
          </UBadge>

          <div class="flex flex-col items-start leading-tight">
            <span class="text-left text-xs text-secondary"> Подкласс: </span>

            <span class="text-left">
              {{ parent ? name.rus : 'Выбрать' }}
            </span>
          </div>
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

    <UButton
      v-if="hasDescription"
      class="ml-auto hidden md:block"
      to="#description"
      variant="soft"
      color="secondary"
      size="md"
      @click.left.exact.prevent="scrollToAnchor('description')"
    >
      <div class="flex flex-col items-end leading-tight">
        <span class="text-xs text-secondary">О классе</span>

        <span>Описание</span>
      </div>
    </UButton>
  </div>
</template>
