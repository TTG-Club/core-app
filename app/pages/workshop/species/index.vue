<script setup lang="ts">
  import { SvgIcon, PageHeader, PageContainer } from '~/shared/ui';
</script>

<template>
  <PageContainer>
    <template #header>
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

          <ATooltip
            title="Вернуться в мастерскую"
            :mouse-enter-delay="0.7"
            destroy-tooltip-on-hide
          >
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
  </PageContainer>
</template>
