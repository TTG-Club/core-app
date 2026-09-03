<script setup lang="ts">
  import {
    getNexusInviteRoute,
    NEXUS_INVITE_COPY_LABEL,
    NEXUS_INVITE_HINT,
    NEXUS_INVITE_LABEL,
  } from '../model';

  /**
   * Ссылка-приглашение владельца.
   *
   * Показывается только ему: код приглашения — это право звать в комнату, и
   * сервис никому другому его не отдаёт.
   */
  const { inviteCode } = defineProps<{
    inviteCode: string;
  }>();

  const { copy } = useCopyAndShare();

  const requestUrl = useRequestURL();

  // Ссылку собираем полной: её копируют и отправляют в мессенджер, а туда
  // относительный путь не годится.
  const inviteUrl = computed(
    () => new URL(getNexusInviteRoute(inviteCode), requestUrl.origin).href,
  );
</script>

<template>
  <section class="flex flex-col gap-2">
    <h3 class="text-lg font-semibold text-highlighted">
      {{ NEXUS_INVITE_LABEL }}
    </h3>

    <p class="text-sm text-muted">{{ NEXUS_INVITE_HINT }}</p>

    <!-- Саму ссылку не показываем: читать её незачем, а длинный код тянет
      строку на всю ширину -->
    <UButton
      color="neutral"
      variant="subtle"
      icon="tabler:copy"
      class="self-start"
      :label="NEXUS_INVITE_COPY_LABEL"
      @click.left.exact.prevent="copy(inviteUrl)"
    />
  </section>
</template>
