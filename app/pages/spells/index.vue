<script setup lang="ts">
  import { SpellLegend, SpellLink } from '~/features/spells';
  import {
    PageContainer,
    PageGrid,
    PageHeader,
    SmallLinkSkeleton,
  } from '~/shared/ui';
  import type { SpellLinkResponse } from '~/shared/types';

  useSeoMeta({
    title: 'Заклинания (Spells)',
    description: 'Заклинания по D&D 2024 редакции',
  });

  const search = ref<string>('');

  const {
    data: spells,
    error,
    status,
    refresh,
  } = await useAsyncData('spells', () =>
    $fetch<Array<SpellLinkResponse>>('/api/v2/spells/search', {
      method: 'POST',
      params: {
        query: search.value || undefined,
      },
    }),
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
      <PageHeader title="Заклинания">
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
          <SpellLegend />
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
          v-else-if="status === 'success' && spells?.length"
          :columns="3"
        >
          <SpellLink
            v-for="spell in spells"
            :key="spell.url"
            :spell="spell"
          />
        </PageGrid>

        <AResult
          v-else-if="status === 'success' && !spells?.length"
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
