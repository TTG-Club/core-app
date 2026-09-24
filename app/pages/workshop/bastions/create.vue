<script setup lang="ts">
  import { BastionFacilityEditor } from '~bastions/editor';
  import {
    BASTION_WORKSHOP_LABELS,
    BASTION_WORKSHOP_PATH,
  } from '~bastions/model';
</script>

<template>
  <NuxtLayout
    :title="BASTION_WORKSHOP_LABELS.createTitle"
    name="detail"
  >
    <template #actions>
      <UTooltip :text="BASTION_WORKSHOP_LABELS.close">
        <UButton
          variant="ghost"
          color="neutral"
          icon="tabler:x"
          @click.left.exact.prevent="navigateTo(BASTION_WORKSHOP_PATH)"
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
