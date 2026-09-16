<script setup lang="ts">
  import type { AvatarProps } from '@nuxt/ui';

  /**
   * Аватарка другого пользователя по его идентификатору. Картинку компонент
   * находит сам через общий кеш `useUserPublicProfiles`: аватарки всей
   * страницы резолвятся одной пачкой. Пока картинки нет (не приехала, не
   * загружена или файл пропал) — инициалы имени.
   */
  const {
    userId = null,
    name = null,
    size,
  } = defineProps<{
    /** Идентификатор пользователя (клейм `sub`); без него — только инициалы. */
    userId?: string | null;
    /** Отображаемое имя: подпись картинки и источник инициалов. */
    name?: string | null;
    /** Размер задаёт место показа: у каждого списка он свой. */
    size: NonNullable<AvatarProps['size']>;
  }>();

  const { watchProfiles, getProfile } = useUserPublicProfiles();

  watchProfiles(() => [userId]);

  const avatarImageUrl = computed(() =>
    userId ? (getProfile(userId)?.avatarUrl ?? undefined) : undefined,
  );

  const avatarAlt = computed(() => name ?? undefined);
</script>

<template>
  <UAvatar
    :src="avatarImageUrl"
    :alt="avatarAlt"
    :size
    :ui="{ fallback: 'uppercase' }"
  />
</template>
