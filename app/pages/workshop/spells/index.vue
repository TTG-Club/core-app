<script setup lang="ts">
  import { PageContainer, PageHeader } from '~ui/page';
  import { SvgIcon } from '~ui/icon';
</script>

<template>
  <PageContainer>
    <template #header>
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
