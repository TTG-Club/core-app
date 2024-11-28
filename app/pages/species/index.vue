<script setup lang="ts">
  import type { SpecieLink } from '#shared/types/character/species';

  useSeoMeta({
    title: 'Виды (Species)',
    description: 'Виды и подвиды персонажей по D&D 2024 редакции',
  });

  const { data, status, error, refresh } = await useProxy<Array<SpecieLink>>(
    '/species/search',
    {
      method: 'post',
    },
  );
</script>

<template>
  <AFlex
    vertical
    :gap="16"
  >
    <AFlex
      :style="{ paddingTop: '32px' }"
      :gap="16"
      vertical
    >
      <ATypographyTitle
        :level="2"
        content="Виды"
        data-allow-mismatch
        ellipsis
      />

      <AFlex :gap="8">
        <AInput
          placeholder="Введите текст..."
          allow-clear
        />

        <AButton type="primary">Фильтр</AButton>
      </AFlex>
    </AFlex>

    <ASpin
      data-allow-mismatch
      size="large"
      :spinning="status === 'pending'"
    >
      <div
        v-if="data?.length"
        :class="$style.species"
      >
        <CharacterSpeciesLink
          v-for="link in data"
          :key="link.url"
          :specie="link"
        >
          {{ link.url }}
        </CharacterSpeciesLink>
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
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
  }
</style>
