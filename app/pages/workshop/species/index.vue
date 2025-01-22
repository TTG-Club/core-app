<script setup lang="ts">
  import { SvgIcon } from '~/shared/ui';
  import { PageHeader } from '~/features/page';
</script>

<template>
  <PageHeader title="Мастерская видов">
    <template #actions>
      <AButton
        type="primary"
        @click.left.exact.prevent="navigateTo('/workshop/species/create')"
      >
        <template #default> Создать новый вид </template>

        <template #icon>
          <SvgIcon icon="plus" />
        </template>
      </AButton>

      <ATooltip title="Вернуться в мастерскую">
        <AButton
          type="text"
          @click.left.exact.prevent="navigateTo('/workshop')"
        >
          <template #icon>
            <SvgIcon icon="close" />
          </template>
        </AButton>
      </ATooltip>
    </template>
  </PageHeader>
</template>
