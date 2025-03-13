<script setup lang="ts">
  import type { SpeciesLinkResponse } from '~/shared/types';
  import { SpeciesLegend } from '~species/legend';
  import { SpeciesLink } from '~species/link';
  import { PageContainer, PageGrid, PageHeader } from '~ui/page';
  import { SpeciesLineagesDrawer } from '~species/lineages-drawer';
  import { SpeciesDrawer } from '~species/drawer';

  useSeoMeta({
    title: 'Виды (Species)',
    description: 'Виды и происхождения персонажей по D&D 2024 редакции',
  });

  const search = ref<string>('');

  const { data, status, error, refresh } = await useAsyncData(
    'species',
    () =>
      $fetch<Array<SpeciesLinkResponse>>('/api/v2/species/search', {
        method: 'post',
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
      <PageHeader title="Виды">
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
          <SpeciesLegend />
        </template>
      </PageHeader>
    </template>

    <template #default>
      <Transition
        name="fade"
        mode="out-in"
      >
        <PageGrid
          v-if="status === 'success' && data?.length"
          :columns="5"
        >
          <SpeciesLink
            v-for="link in data"
            :key="link.url"
            :species="link"
          >
            {{ link.url }}
          </SpeciesLink>
        </PageGrid>

        <AResult
          v-else-if="status === 'success' && !data?.length"
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
          v-else-if="error"
          status="error"
          title="Ошибка"
          :sub-title="error"
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

      <ClientOnly>
        <SpeciesDrawer />

        <SpeciesLineagesDrawer />
      </ClientOnly>
    </template>
  </PageContainer>
</template>
