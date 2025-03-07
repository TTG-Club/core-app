<script setup lang="ts">
  import { SpellsEditor } from '~/features/spells';
  import { PageContainer, PageHeader, SvgIcon } from '~/shared/ui';
</script>

<template>
  <PageContainer fixed-header>
    <template #header>
      <PageHeader title="Создание нового заклинания">
        <template #actions>
          <ATooltip
            title="Закрыть"
            :mouse-enter-delay="0.7"
            destroy-tooltip-on-hide
          >
            <AButton
              type="text"
              @click.left.exact.prevent="navigateTo('/workshop/spells')"
            >
              <template #icon>
                <SvgIcon icon="close" />
              </template>
            </AButton>
          </ATooltip>
        </template>
      </PageHeader>
    </template>

    <template #default>
      <ClientOnly>
        <SpellsEditor />
      </ClientOnly>
    </template>
  </PageContainer>
</template>
