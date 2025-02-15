<script setup lang="ts">
  import type { SpecieLink } from '~/shared/types';
  import { PageHeader } from '~/features/page';
  import { SpeciesLink } from '~/features/wiki';

  useSeoMeta({
    title: 'Виды (Species)',
    description: 'Виды и подвиды персонажей по D&D 2024 редакции',
  });

  const { data, status, error, refresh } = await useAsyncData('species', () =>
    $fetch<Array<SpecieLink>>('/api/v2/species/search', {
      method: 'post',
    }),
  );
</script>

<template>
  <AFlex
    vertical
    :gap="16"
  >
    <PageHeader title="Виды">
      <template #filter>
        <AButton
          type="primary"
          :style="{ boxShadow: 'none' }"
        >
          Фильтры
        </AButton>

        <AInput
          placeholder="Введите текст..."
          allow-clear
        />
      </template>
    </PageHeader>

    <ASpin
      data-allow-mismatch
      size="large"
      :spinning="status === 'pending'"
    >
      <div
        v-if="data?.length"
        :class="$style.species"
      >
        <SpeciesLink
          v-for="link in data"
          :key="link.url"
          :specie="link"
        >
          {{ link.url }}
        </SpeciesLink>
      </div>

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

      <AResult
        v-else
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
    </ASpin>
  </AFlex>
</template>

<style module lang="scss">
  .species {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 16px;

    @include media-min($sm) {
      grid-template-columns: repeat(3, 1fr);
    }

    @include media-min($md) {
      grid-template-columns: repeat(3, 1fr);
    }

    @include media-min($lg) {
      grid-template-columns: repeat(4, 1fr);
    }

    @include media-min($xl) {
      grid-template-columns: repeat(5, 1fr);
    }
  }
</style>
