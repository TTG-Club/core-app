<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { UserProfile } from '~/shared/types';

  import { useMyRewards } from '~profile/activation/composables';
  import { AVATAR_FRAME_IMAGE_URL } from '~profile/activation/model';
  import { ImageCropModal } from '~ui/image-crop';

  import { useProfileAvatar } from '../composables';
  import { PROFILE_AVATAR_LABELS } from '../model';

  const props = defineProps<{
    profile?: UserProfile;
  }>();

  const { hasPerk } = useMyRewards();
  const { isSaving, uploadAvatar, removeAvatar } = useProfileAvatar();

  const overlay = useOverlay();

  // Инициалы аватара берём из отображаемого имени, иначе из логина.
  const avatarAlt = computed(
    () => props.profile?.displayName || props.profile?.username,
  );

  const avatarImageUrl = computed(() => props.profile?.avatarUrl ?? undefined);

  const hasAvatar = computed(() => Boolean(props.profile?.avatarUrl));

  // Рамка аватара — косметический перк AVATAR_FRAME, выданный кодом.
  const hasAvatarFrame = computed(() => hasPerk('AVATAR_FRAME'));

  /**
   * Выбор области и загрузка результата. Редактор создаётся на каждый файл:
   * `destroyOnClose` снимает его после закрытия, и следующий выбор открывает
   * редактор с новой картинкой. Редактор отдаёт статичный квадрат, поэтому
   * анимация до сервера не доходит.
   *
   * @param file выбранный файл.
   */
  async function cropAndUpload(file: File): Promise<void> {
    const cropModal = overlay.create(ImageCropModal, {
      destroyOnClose: true,
      props: { file },
    });

    const croppedFile = await cropModal.open();

    if (!croppedFile) {
      return;
    }

    await uploadAvatar(croppedFile);
  }

  const {
    open: openFileDialog,
    onChange,
    reset: resetFileDialog,
  } = useFileDialog({
    accept: IMAGE_UPLOAD_ACCEPT,
    multiple: false,
  });

  /**
   * Передаёт выбранный файл в редактор кадрирования. Выбор сразу сбрасывается,
   * иначе тот же файл второй раз не вызвал бы изменения.
   *
   * @param files выбор из диалога; null — диалог сброшен.
   */
  function handleFilesChange(files: FileList | null): void {
    const file = files ? Array.from(files)[0] : undefined;

    resetFileDialog();

    if (file) {
      void cropAndUpload(file);
    }
  }

  onChange(handleFilesChange);

  /** Открывает выбор файла для новой аватарки. */
  function handleUploadSelect(): void {
    openFileDialog();
  }

  /** Убирает аватарку — вместо неё снова инициалы. */
  function handleRemoveSelect(): void {
    void removeAvatar();
  }

  const menuItems = computed<DropdownMenuItem[]>(() => {
    if (!hasAvatar.value) {
      return [
        {
          label: PROFILE_AVATAR_LABELS.upload,
          icon: 'tabler:upload',
          onSelect: handleUploadSelect,
        },
      ];
    }

    return [
      {
        label: PROFILE_AVATAR_LABELS.replace,
        icon: 'tabler:photo-edit',
        onSelect: handleUploadSelect,
      },
      {
        label: PROFILE_AVATAR_LABELS.remove,
        icon: 'tabler:trash',
        color: 'error',
        onSelect: handleRemoveSelect,
      },
    ];
  });
</script>

<template>
  <UDropdownMenu
    :items="menuItems"
    :disabled="isSaving"
    :content="{ align: 'center' }"
  >
    <button
      type="button"
      class="group relative mb-6 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      :aria-label="PROFILE_AVATAR_LABELS.menuAria"
    >
      <span
        class="absolute inset-0 rounded-full bg-primary/20 blur-3xl transition-colors duration-500 group-hover:bg-primary/40"
      />

      <UAvatar
        :src="avatarImageUrl"
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

      <span
        v-if="isSaving"
        class="absolute inset-0 z-20 grid place-items-center rounded-full bg-elevated/70"
      >
        <UIcon
          name="tabler:loader-2"
          class="size-8 animate-spin text-primary"
        />
      </span>

      <!-- Значок камеры: на сенсорных экранах наведения нет, там он виден всегда -->
      <span
        v-else
        aria-hidden="true"
        class="absolute right-1 bottom-1 z-20 grid size-7 translate-y-2 place-items-center rounded-full bg-primary text-inverted opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 pointer-coarse:translate-y-0 pointer-coarse:opacity-100"
      >
        <UIcon
          name="tabler:camera"
          class="size-4"
        />
      </span>
    </button>
  </UDropdownMenu>
</template>
