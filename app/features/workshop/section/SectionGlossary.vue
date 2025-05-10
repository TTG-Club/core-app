<script setup lang="ts">
  import { SvgIcon } from '~ui/icon';
</script>

<template>
  <ACard>
    <AFlex
      :gap="8"
      vertical
    >
      <ACardMeta title="Мастерская глоссария" />

      <div>Создано: <NuxtLink to="/workshop/glossary">0</NuxtLink></div>

      <div>На модерации: <NuxtLink to="/workshop/glossary">0</NuxtLink></div>

      <div>Черновики: <NuxtLink to="/workshop/glossary">0</NuxtLink></div>
    </AFlex>

    <AFlex
      :style="{ marginTop: 'auto' }"
      justify="end"
    >
      <AButton
        type="primary"
        @click.left.exact.prevent="navigateTo('/workshop/glossary/create')"
      >
        <template #default> Создать запись глоссария </template>

        <template #icon>
          <SvgIcon icon="plus" />
        </template>
      </AButton>
    </AFlex>
  </ACard>
</template>
