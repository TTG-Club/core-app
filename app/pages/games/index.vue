<script setup lang="ts">
  import type { NuxtError } from '#app';
  import type {
    PolymorpherGameCard as PolymorpherGameCardType,
    PolymorpherGamesResponse,
  } from '~/shared/types/polymorpher';
  import type { Filter } from '~infrastructure/filter';

  import { refDebounced, useIntersectionObserver } from '@vueuse/core';
  import { cloneDeep } from 'es-toolkit';

  import { PolymorpherGameCard } from '~games';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkBig } from '~ui/skeleton';

  useSeoMeta({
    title: 'Игры с Polymorpher',
    description: 'Подборка открытых игр с Polymorpher.',
  });

  const search = ref<string>('');
  const filter = defineModel<Filter>('filter');
  const debouncedSearch = refDebounced(search, 400);
  const route = useRoute();
  const { isApple } = useDevice();
  const { share } = useCopyAndShare();

  const { isPending = false } = defineProps<{
    isPending?: boolean;
    showPreview?: boolean;
  }>();

  const filterOpened = ref(false);

  const urlForCopy = computed(() => {
    return getOrigin() + route.fullPath;
  });

  const isFilterEdited = computed(
    () =>
      !!filter.value
      && filter.value.filter.groups.some((group) =>
        group.filters.some((item) => item.selected !== null),
      ),
  );

  function resetFilter() {
    if (!filter.value) {
      filterOpened.value = false;

      return;
    }

    const cloned = cloneDeep(filter.value.filter);

    filter.value = {
      ...filter.value,
      filter: {
        ...cloned,
        groups: cloned.groups.map((group) => ({
          ...group,
          filters: group.filters.map((item) => ({
            ...item,
            selected: null,
          })),
        })),
      },
    };

    filterOpened.value = false;
  }

  const page = ref<number>(0);
  const size = ref<number>(12);

  const games = ref<PolymorpherGameCardType[]>([]);
  const totalElements = ref<number>(0);
  const status = ref<'pending' | 'success' | 'error'>('pending');
  const error = ref<NuxtError | null>(null);
  const isLoadingMore = ref(false);

  const sentinel = ref<HTMLElement | null>(null);

  const hasMore = computed(() => games.value.length < totalElements.value);

  async function loadGames(reset: boolean = false): Promise<void> {
    if (isLoadingMore.value) {
      return;
    }

    if (reset) {
      status.value = 'pending';
      error.value = null;
      page.value = 0;
    }

    isLoadingMore.value = true;

    try {
      const response = await $fetch<PolymorpherGamesResponse>(
        '/api/polymorpher/games',
        {
          method: 'GET',
          query: {
            search: debouncedSearch.value || undefined,
            page: page.value,
            size: size.value,
          },
        },
      );

      if (reset) {
        games.value = response.content;
      } else {
        const existingIds = new Set(games.value.map((game) => game.id));

        games.value = [
          ...games.value,
          ...response.content.filter((game) => !existingIds.has(game.id)),
        ];
      }

      totalElements.value = response.totalElements ?? 0;
      page.value += 1;
      status.value = 'success';
    } catch (cause) {
      error.value = createError({
        statusCode: 500,
        statusMessage: 'Ошибка загрузки игр',
        data: cause,
      });

      status.value = 'error';
    } finally {
      isLoadingMore.value = false;
    }
  }

  watch(debouncedSearch, async () => {
    await loadGames(true);
  });

  await loadGames(true);

  useIntersectionObserver(
    sentinel,
    async ([entry]) => {
      if (!entry?.isIntersecting || isLoadingMore.value || !hasMore.value) {
        return;
      }

      await loadGames(false);
    },
    {
      rootMargin: '300px 0px',
    },
  );

  function refresh(): Promise<void> {
    return loadGames(true);
  }
</script>

<template>
  <NuxtLayout
    name="section"
    title="Игры"
  >
    <template #controls>
      <div class="space-y-3">
        <UInput
          v-model="search"
          placeholder="Поиск..."
          allow-clear
          :ui="{ trailing: 'pe-0.5' }"
          size="lg"
        >
          <template
            v-if="search"
            #trailing
          >
            <UButton
              icon="tabler:x"
              variant="link"
              color="neutral"
              size="sm"
              @click.left.exact.prevent="search = ''"
            />
          </template>
        </UInput>
      </div>

      <div class="flex gap-2">
        <UFieldGroup class="w-full space-x-px">
          <UButton
            :disabled="!filter"
            :loading="isPending"
            icon="tabler:filter"
            label="Фильтр"
            block
            @click.left.exact.prevent="filterOpened = true"
          />

          <UButton
            v-if="isFilterEdited"
            title="Очистить фильтр"
            icon="tabler:trash"
            @click.left.exact.prevent="resetFilter"
          />
        </UFieldGroup>

        <UButton
          :icon="isApple ? 'tabler:share-2' : 'tabler:share'"
          title="Поделиться ссылкой"
          square
          @click.left.exact.prevent="share(urlForCopy)"
        />
      </div>
    </template>

    <template #default>
      <div class="space-y-4">
        <Transition
          name="fade"
          mode="out-in"
        >
          <PageGrid v-if="status === 'pending' && !games.length">
            <SkeletonLinkBig
              v-for="index in size"
              :key="index"
            />
          </PageGrid>

          <PageGrid v-else-if="status === 'success' && games.length">
            <template
              v-for="game in games"
              :key="game.id"
            >
              <PolymorpherGameCard :game="game" />
            </template>

            <template v-if="isLoadingMore">
              <SkeletonLinkBig
                v-for="index in 3"
                :key="`loading-${index}`"
              />
            </template>

            <div
              v-if="hasMore"
              ref="sentinel"
              class="col-span-full h-2"
            />
          </PageGrid>

          <PageResult
            v-else
            :items="games"
            :status="status"
            :error="error ?? undefined"
            @refresh="refresh"
          />
        </Transition>
      </div>
    </template>
  </NuxtLayout>
</template>
