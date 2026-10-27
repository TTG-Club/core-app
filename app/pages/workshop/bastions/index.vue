<script setup lang="ts">
  import {
    BASTION_WORKSHOP_LABELS,
    BASTION_WORKSHOP_PATH,
  } from '~bastions/model';
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="BASTION_WORKSHOP_LABELS.listTitle"
  >
    <template #actions>
      <UButton
        icon="tabler:plus"
        color="neutral"
        variant="ghost"
        @click.left.exact.prevent="
          navigateTo(`${BASTION_WORKSHOP_PATH}/create`)
        "
      >
        {{ BASTION_WORKSHOP_LABELS.create }}
      </UButton>

      <UTooltip :text="BASTION_WORKSHOP_LABELS.back">
        <UButton
          variant="ghost"
          color="neutral"
          icon="tabler:x"
          @click.left.exact.prevent="navigateTo('/workshop')"
        />
      </UTooltip>
    </template>
  </NuxtLayout>
</template>
