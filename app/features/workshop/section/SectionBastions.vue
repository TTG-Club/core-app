<script setup lang="ts">
  import { BASTION_SECTION, BASTION_WORKSHOP_LABELS } from '~bastions/model';
  import { CardWorkshop } from '~ui/card';
</script>

<template>
  <CardWorkshop
    :title="BASTION_WORKSHOP_LABELS.section"
    :section="BASTION_SECTION"
  />
</template>
