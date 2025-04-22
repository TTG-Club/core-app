<script setup lang="ts">
  import { BackgroundLegend } from '~backgrounds/legend';
  import { BackgroundLink } from '~backgrounds/link';
  import { PageContainer, PageGrid, PageHeader } from '~ui/page';
  import { SmallLinkSkeleton } from '~ui/skeleton';

  import type { BackgroundLinkResponse } from '~/shared/types';

  useSeoMeta({
    title: 'Предыстории [Backgrounds]',
    description: 'Предыстории по D&D 2024 редакции',
  });

  const search = ref<string>('');

  const {
    data: backgrounds,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'backgrounds',
    () =>
      $fetch<Array<BackgroundLinkResponse>>('/api/v2/background/search', {
        method: 'POST',
        params: {
          query: search.value || undefined,
        },
      }),
    { deep: false },
  );

  const onSearch = useDebounceFn(() => {
    if (search.value && search.value.length < 3) {
      return;
    }

    refresh();
  }, 1000);
</script>

<template>
  <PageContainer fixed-header>
    <template #header>
      <PageHeader title="Предыстории">
        <template #filter>
          <AButton
            :style="{ boxShadow: 'none' }"
            type="primary"
            disabled
          >
            Фильтры
          </AButton>

          <AInput
            v-model:value="search"
            placeholder="Введите текст..."
            allow-clear
            @change="onSearch"
          />
        </template>

        <template #legend>
          <BackgroundLegend />
        </template>
      </PageHeader>
    </template>

    <template #default>
      <Transition
        name="fade"
        mode="out-in"
      >
        <PageGrid
          v-if="status !== 'success' && status !== 'error'"
          :columns="3"
        >
          <SmallLinkSkeleton
            v-for="index in 5"
            :key="index"
          />
        </PageGrid>

        <PageGrid
          v-else-if="status === 'success' && backgrounds?.length"
          :columns="3"
        >
          <BackgroundLink
            v-for="background in backgrounds"
            :key="background.url"
            :background="background"
          />
        </PageGrid>

        <AResult
          v-else-if="status === 'success' && !backgrounds?.length"
          title="Ничего не нашлось"
          sub-title="По вашему запросу ничего не нашлось. Попробуйте изменить фильтр или строку поиска"
        >
          <template #extra>
            <AButton
              type="primary"
              @click.left.exact.prevent="refresh()"
            >
              Обновить
            </AButton>

            <AButton @click.left.exact.prevent="navigateTo('/')">
              Вернуться на главную
            </AButton>
          </template>
        </AResult>

        <AResult
          v-else-if="status === 'error'"
          :sub-title="error"
          status="error"
          title="Ошибка"
        >
          <template #extra>
            <AButton
              type="primary"
              @click.left.exact.prevent="refresh()"
            >
              Обновить
            </AButton>

            <AButton @click.left.exact.prevent="navigateTo('/')">
              Вернуться на главную
            </AButton>
          </template>
        </AResult>
      </Transition>
    </template>
  </PageContainer>
</template>
