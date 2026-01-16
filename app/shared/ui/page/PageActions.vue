<script setup lang="ts">
  import { useUserStore } from '~/shared/stores';

  import { CopyButton } from '../copy-button';

  import type { RouteLocationRaw } from 'vue-router';

  const { closeUrl = undefined, editUrl = undefined } = defineProps<{
    closeUrl?: RouteLocationRaw | undefined | null;
    editUrl?: string;
  }>();

  const emit = defineEmits<{
    (e: 'close'): void;
  }>();

  const route = useRoute();
  const router = useRouter();

  const { isAdmin } = storeToRefs(useUserStore());

  const urlForCopy = computed(() => {
    return getOrigin() + route.fullPath;
  });

  function close() {
    if (!closeUrl) {
      emit('close');

      return;
    }

    const backUrl = window.history.state.back;

    if (backUrl?.startsWith('/')) {
      router.back();
    } else {
      navigateTo(closeUrl);
    }
  }
</script>

<template>
  <UTooltip
    v-if="editUrl && isAdmin"
    text="Редактировать"
  >
    <UButton
      :href="editUrl"
      icon="i-ttg-edit"
      variant="ghost"
      target="_blank"
      color="neutral"
      no-rel
    />
  </UTooltip>

  <CopyButton :url="urlForCopy" />

  <UTooltip text="Закрыть">
    <UButton
      variant="ghost"
      color="neutral"
      icon="i-ttg-x"
      @click.left.exact.prevent="close"
    />
  </UTooltip>
</template>
