<script setup lang="ts">
  import type { CommandPaletteGroup } from '@nuxt/ui';

  import type { NameResponse } from '~/shared/types';

  import type { ClassLinkResponse } from '../../model';

  import { uniqBy } from 'es-toolkit';

  import { MulticlassDrawer } from '~classes/multiclass-drawer';
  import { SourceTag } from '~ui/source-tag';

  const {
    url,
    name,
    parent = undefined,
    hasSpells = false,
    navigateInPlace = false,
  } = defineProps<{
    url: string;
    name: NameResponse;
    parent?: ClassLinkResponse;
    hasDescription?: boolean;
    hasSpells?: boolean;
    /**
     * Включает inline-навигацию: подкласс/класс переключаются
     * внутри текущего контейнера (drawer) без перехода на отдельную страницу.
     */
    navigateInPlace?: boolean;
  }>();

  const emit = defineEmits<{
    /**
     * Навигация к другому классу/подклассу внутри текущего контейнера.
     */
    (event: 'navigate', classUrl: string): void;
  }>();

  const { data: subclasses, status } = await useAsyncData(
    computed(() => `class-${parent ? parent.url : url}-subclasses`),
    () =>
      $fetch<Array<ClassLinkResponse>>(
        `/api/v2/classes/${parent ? parent.url : url}/subclasses`,
      ),
  );

  const search = ref<string>();

  const isLoading = computed(() => status.value === 'pending');

  // Модальное окно для создания мультикласса
  const overlay = useOverlay();

  const multiclassDrawer = overlay.create(MulticlassDrawer, {
    props: {
      url, // URL текущей страницы (подкласса, если есть)
      name,
      parent, // Основной класс, если текущий - подкласс
      onClose: () => multiclassDrawer.close(),
    },
    destroyOnClose: true,
  });

  /** Ссылка на popover для программного закрытия после выбора подкласса */
  const popoverOpen = ref(false);

  /**
   * Обработчик выбора подкласса из CommandPalette.
   * При navigateInPlace переключает содержимое inline,
   * иначе навигирует стандартным роутером.
   */
  function handleSubclassSelect(subclassUrl: string): void {
    popoverOpen.value = false;
    emit('navigate', subclassUrl);
  }

  /**
   * Обработчик клика по кнопке «Класс» — возврат к основному классу.
   */
  function handleClassClick(): void {
    emit('navigate', parent ? parent.url : url);
  }

  /** Прокрутка к блоку описания внутри текущего контейнера */
  function scrollToDescription(): void {
    document.getElementById('description')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

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
          source: subclass.source,
          ...(navigateInPlace
            ? { onSelect: () => handleSubclassSelect(subclass.url) }
            : { to: `/classes/${subclass.url}` }),
        })),
    }));
  });
</script>

<template>
  <div class="flex w-auto flex-wrap gap-2">
    <UButton
      :to="
        navigateInPlace ? undefined : `/classes/${parent ? parent.url : url}`
      "
      variant="soft"
      color="secondary"
      size="md"
      @click.left.exact.prevent="navigateInPlace && handleClassClick()"
    >
      <div class="flex flex-col items-start leading-tight">
        <span class="text-xs text-secondary"> Класс: </span>

        <span>{{ parent ? parent.name.rus : name.rus }}</span>
      </div>
    </UButton>

    <UPopover
      v-model:open="popoverOpen"
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
          :autofocus="false"
          :groups
          :ui="{
            input: '[&>input]:h-8 [&>input]:text-sm',
            content: 'max-h-80',
          }"
        >
          <template #item-trailing="{ item }">
            <SourceTag :source="item.source" />
          </template>
        </UCommandPalette>
      </template>
    </UPopover>

    <UButton
      v-if="hasSpells"
      icon="tabler:vocabulary"
      :to="{
        path: '/spells',
        query: {
          className: parent ? parent.url : url,
          subclassName: parent ? url : undefined,
        },
      }"
      target="_blank"
      variant="soft"
      color="secondary"
      size="md"
    >
      <div class="flex flex-col items-start leading-tight">
        <span class="text-xs text-secondary">Список:</span>

        <span>Заклинаний</span>
      </div>
    </UButton>

    <UButton
      variant="soft"
      color="primary"
      size="md"
      @click.left.exact.prevent.stop="multiclassDrawer.open()"
    >
      <div class="flex flex-col items-start leading-tight">
        <span class="text-left text-xs text-secondary"> Создать </span>

        <span class="text-left">Мультикласс</span>
      </div>
    </UButton>

    <UButton
      v-if="hasDescription"
      class="ml-auto hidden md:block"
      :to="navigateInPlace ? undefined : '#description'"
      variant="soft"
      color="secondary"
      size="md"
      @click.left.exact.prevent="scrollToDescription"
    >
      <div class="flex flex-col items-end leading-tight">
        <span class="text-xs text-secondary">О классе</span>

        <span>Описание</span>
      </div>
    </UButton>
  </div>
</template>
