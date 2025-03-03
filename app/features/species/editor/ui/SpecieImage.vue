<script setup lang="ts">
  import { SvgIcon, SvgLoading } from '~/shared/ui';
  import type { UploadProps } from 'ant-design-vue/es/upload';
  import bytes from 'bytes';
  import type { UploadChangeParam, UploadFile } from 'ant-design-vue';
  import type { UploadResponse } from '~/shared/types';
  import type { NuxtError } from '#app';
  import type { FileType } from 'ant-design-vue/es/upload/interface';
  import { toNumber } from 'lodash-es';
  import { getStatusMessage } from '#shared/utils';

  const props = withDefaults(
    defineProps<{
      path?: string;

      /**
       * Максимальная длина короткой стороны
       */
      maxSize?: string | number;
    }>(),
    {
      path: '',
      maxSize: undefined,
    },
  );

  if (typeof props.maxSize === 'string' && !/\d+/.test(props.maxSize)) {
    throw new Error('maxSize must be a Number or number in String');
  }

  if (props.maxSize && toNumber(props.maxSize) > 2048) {
    throw new Error('maxSize must be lower or equal to 2048');
  }

  const maxFileWeight = bytes('5MB')!;
  const maxFileSize = 2048;

  const { notification } = App.useApp();

  const actionUrl = computed(() => {
    const url = new URLSearchParams();

    if (props.path) {
      url.set('path', props.path);
    }

    if (props.maxSize) {
      url.set('maxSize', props.maxSize.toString());
    }

    return `/api/s3?${url.toString()}`;
  });

  const onError = (error: Error, responseError: NuxtError) => {
    notification.error({
      message: 'Неизвестная ошибка',
      description: getStatusMessage(responseError.statusCode),
    });
  };

  const imageUploaded = defineModel<string>();

  const bufferToBase64 = (buf: ArrayBuffer) => {
    const chunks = [];
    const uint8 = new Uint8Array(buf);
    const chunkSize = 0x8000;

    for (let i = 0; i < uint8.length; i += chunkSize) {
      const chunk = uint8.subarray(i, Math.min(i + chunkSize, uint8.length));

      chunks.push(String.fromCharCode(...chunk));
    }

    return btoa(chunks.join(''));
  };

  const getImageSize = (
    provideFile: FileType,
  ): Promise<{
    width: number;
    height: number;
  }> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.readAsDataURL(provideFile);

      reader.onload = () => {
        const img = new Image();

        if (!reader.result) {
          reject('Неизвестная ошибка');

          return;
        }

        img.src =
          reader.result instanceof ArrayBuffer
            ? bufferToBase64(reader.result)
            : reader.result;

        img.onload = () => {
          if (!img.width || !img.height) {
            reject('Неизвестная ошибка');

            return;
          }

          resolve({
            width: img.width,
            height: img.height,
          });
        };
      };
    });

  function removeLoadedImage() {
    return $fetch('/api/s3', {
      method: 'delete',
      query: {
        path: props.path,
        keyOrUrl: imageUploaded.value,
      },
    });
  }

  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    const isExtensionSuccess =
      file.type === 'image/jpeg' ||
      file.type === 'image/png' ||
      file.type === 'image/webp';

    if (!isExtensionSuccess) {
      notification.error({
        message: 'Ошибка при загрузке файла',
        description: 'Недопустимый формат изображения',
      });

      return false;
    }

    if (file.size > maxFileWeight) {
      notification.error({
        message: 'Ошибка при загрузке файла',
        description: `Размер изображения не должен превышать ${bytes(maxFileWeight)}`,
      });

      return false;
    }

    try {
      const imageSize = await getImageSize(file);

      if (imageSize.width > maxFileSize || imageSize.height > maxFileSize) {
        notification.error({
          message: 'Ошибка при загрузке файла',
          description: `Изображение должно быть меньше ${maxFileSize}px по длинной стороне`,
        });

        return false;
      }

      return true;
    } catch (err) {
      notification.error({
        message: 'Ошибка при загрузке файла',
        description: 'Неизвестная ошибка',
      });

      throw err;
    }
  };

  const isImageLoading = ref(false);

  const handleImageChange = async (
    info: UploadChangeParam<UploadFile<UploadResponse>>,
  ) => {
    isImageLoading.value = info.file.status === 'uploading';

    if (info.file.status === 'done') {
      if (imageUploaded.value) {
        await removeLoadedImage();
      }

      imageUploaded.value = info.file.response?.url;
    }
  };
</script>

<template>
  <AFlex
    vertical
    :gap="16"
  >
    <AUploadDragger
      :action="actionUrl"
      method="put"
      accept=".webp, .jpg, .jpeg, .png"
      :multiple="false"
      :max-count="1"
      :show-upload-list="false"
      :disabled="isImageLoading"
      :before-upload="beforeUpload"
      @error="onError"
      @change="handleImageChange"
    >
      <AFlex
        :class="$style.upload"
        :gap="8"
        justify="center"
        align="center"
        vertical
      >
        <SvgLoading
          v-if="isImageLoading"
          size="24"
        />

        <SvgIcon
          v-else
          size="24"
          icon="download"
        />

        <span type="secondary">
          Перетащите или нажмите сюда, чтобы загрузить картинку в форматах:
          .webp, .jpg, .jpeg, .png
        </span>
      </AFlex>
    </AUploadDragger>

    <div :class="$style.preview">
      <slot name="preview">
        <div :class="$style.img">
          <AImage
            :preview="false"
            :src="imageUploaded || '/img/no-img.webp'"
            width="100%"
            fallback="/img/no-img.webp"
          />
        </div>
      </slot>

      <AButton
        :class="$style.remove"
        type="primary"
        danger
      >
        <template #icon>
          <SvgIcon icon="remove" />
        </template>
      </AButton>
    </div>
  </AFlex>
</template>

<style module lang="scss">
  .upload {
    color: currentColor;
  }

  .preview {
    position: relative;

    &:not(:hover) {
      .remove {
        pointer-events: none;
        opacity: 0;
      }
    }
  }

  .img {
    overflow: hidden;
    background-color: var(--color-hover);
    border-radius: 8px;
  }

  .remove {
    position: absolute;
    top: 8px;
    right: 8px;

    & {
      @include css-anim();
    }
  }
</style>
