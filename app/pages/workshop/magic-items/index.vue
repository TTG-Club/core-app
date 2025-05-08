<script setup lang="ts">
  import { SvgIcon } from '~ui/icon';
  import { PageContainer, PageHeader } from '~ui/page';
</script>

<template>
  <PageContainer>
    <template #header>
      <PageHeader title="Мастерская магических предметов">
        <template #actions>
          <AButton
            type="primary"
            @click.left.exact.prevent="
              navigateTo('/workshop/magic-items/create')
            "
          >
            <template #default> Создать магический предмет </template>

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
