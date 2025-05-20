<script setup lang="ts">
  import { FilterControls } from '~filter/controls';
  import { SpeciesLegend } from '~species/legend';
  import { SpeciesLink } from '~species/link';
  import { PageContainer, PageGrid, PageHeader } from '~ui/page';

  import type { SpeciesLinkResponse } from '~/shared/types';

  useSeoMeta({
    title: 'Виды [Species]',
    description: 'Виды и происхождения персонажей по D&D 2024 редакции',
  });

  const search = ref<string>('');

  const { data, status, error, refresh } = await useAsyncData(
    'species',
    () =>
      $fetch<Array<SpeciesLinkResponse>>('/api/v2/species/search', {
        method: 'post',
        params: {
          query:
            search.value && search.value.length >= 3 ? search.value : undefined,
        },
      }),
    {
      deep: false,
      watch: [search],
    },
  );
</script>

<template>
  <PageContainer fixed-header>
    <template #header>
      <PageHeader title="Виды" />
    </template>

    <template #controls>
      <FilterControls v-model:search="search">
        <template #legend>
          <SpeciesLegend />
        </template>
      </FilterControls>
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
    </template>
  </PageContainer>
</template>
