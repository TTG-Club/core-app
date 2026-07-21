<script setup lang="ts">
  import type { UserProfile } from '~/shared/types';

  import { useMyRewards } from '~profile/activation/composables';
  import { AVATAR_FRAME_IMAGE_URL } from '~profile/activation/model';

  const props = defineProps<{
    profile?: UserProfile;
  }>();

  const { hasPerk } = useMyRewards();

  // Инициалы аватара берём из отображаемого имени, иначе из логина.
  const avatarAlt = computed(
    () => props.profile?.displayName || props.profile?.username,
  );

  // Рамка аватара — косметический перк AVATAR_FRAME, выданный кодом.
  const hasAvatarFrame = computed(() => hasPerk('AVATAR_FRAME'));
</script>

<template>
  <div
    class="group relative mb-6 cursor-pointer"
    @click.left.exact.prevent
  >
    <div
      class="absolute inset-0 rounded-full bg-primary/20 blur-3xl transition-colors duration-500 group-hover:bg-primary/40"
    />

    <UAvatar
      :alt="avatarAlt"
      size="3xl"
      class="relative z-10 h-32 w-32 text-4xl shadow-2xl ring-4 ring-default transition-transform duration-200 group-active:scale-95"
    />

    <!-- Рамка аватара (перк AVATAR_FRAME из кода) — оверлей поверх аватара -->
    <img
      v-if="hasAvatarFrame"
      :src="AVATAR_FRAME_IMAGE_URL"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 z-10 h-full w-full scale-[1.35] object-contain"
    />

    <UButton
      size="xs"
      color="primary"
      variant="solid"
      icon="tabler:camera"
      class="absolute right-1 bottom-1 z-20 translate-y-2 rounded-full opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
    />
  </div>
</template>
