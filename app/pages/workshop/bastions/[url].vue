<script setup lang="ts">
  import { BastionFacilityEditor } from '~bastions/editor';
  import { BASTION_SECTION, BASTION_WORKSHOP_LABELS } from '~bastions/model';
</script>

<template>
  <NuxtLayout
    :title="BASTION_WORKSHOP_LABELS.editTitle"
    name="detail"
  >
    <template #actions>
      <UTooltip :text="BASTION_WORKSHOP_LABELS.close">
        <UButton
          variant="ghost"
          color="neutral"
          icon="tabler:x"
          @click.left.exact.prevent="navigateTo(`/${BASTION_SECTION}`)"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <BastionFacilityEditor />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
