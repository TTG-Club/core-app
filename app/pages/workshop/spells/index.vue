<script setup lang="ts">
  import { SvgIcon } from '~/shared/ui';
  import { PageHeader } from '~/features/page';
</script>

<template>
  <PageHeader title="Мастерская заклинаний">
    <template #actions>
      <AButton
        type="primary"
        @click.left.exact.prevent="navigateTo('/workshop/spells/create')"
      >
        <template #default> Создать заклинание </template>

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
