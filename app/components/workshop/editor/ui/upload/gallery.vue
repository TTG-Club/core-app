<script setup lang="ts">
  import { SvgIcon, SvgLoading } from '#components';
  import type { UploadProps } from 'ant-design-vue/es/upload';
  import bytes from 'bytes';
  import type { UploadFile } from 'ant-design-vue';
  import type { UploadResponse } from '#shared/types/upload';
  import type { NuxtError } from '#app';
  import type { FileType } from 'ant-design-vue/es/upload/interface';
  import { chunk } from 'lodash-es';

  const props = withDefaults(
    defineProps<{
      path?: string;
    }>(),
    {
      path: '',
    },
  );

  const maxFileWeight = bytes('5MB')!;
  const maxFileSize = 2048;

  const { notification } = App.useApp();

  const actionUrl = computed(() => {
    const url = new URLSearchParams();

    if (props.path) {
      url.set('path', props.path);
    }

    return `/api/s3?${url.toString()}`;
  });

  const onError = (error: Error, responseError: NuxtError) => {
    notification.error({
      message: 'Неизвестная ошибка',
      description: getStatusMessage(responseError.statusCode),
    });
  };

  const fileList = ref<Array<UploadFile<UploadResponse>>>([]);
  const imagesUploaded = defineModel<Array<string>>();

  const chunkedPreview = computed(() => chunk(imagesUploaded.value, 3));

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

  watch(fileList, (value) => {
    const images: Array<UploadResponse> = [];

    for (const file of value) {
      if (!file.response) {
        continue;
      }

      images.push(file.response);
    }

    imagesUploaded.value = images.map((image) => image.url);
  });
</script>

<template>
  <AFlex
    vertical
    :gap="16"
  >
    <AUploadDragger
      v-model:file-list="fileList"
      :action="actionUrl"
      method="put"
      accept=".webp, .jpg, .jpeg, .png"
      :multiple="true"
      :show-upload-list="false"
      :disabled="isImageLoading"
      :before-upload="beforeUpload"
      @error="onError"
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

    <template v-if="chunkedPreview?.length">
      <AImagePreviewGroup>
        <ARow
          v-for="(row, index) in chunkedPreview"
          :key="index"
          :gutter="16"
        >
          <ACol
            v-for="image in row"
            :key="image"
            :span="8"
          >
            <div :class="$style.preview">
              <div :class="$style.imageContainer">
                <AImage
                  :src="image || '/img/no-img.webp'"
                  :class="$style.image"
                  fallback="/img/no-img.webp"
                  width="100%"
                  height="100%"
                />
              </div>

              <div :class="$style.controls">
                <AButton
                  size="small"
                  type="primary"
                  danger
                >
                  <template #icon>
                    <SvgIcon icon="remove" />
                  </template>
                </AButton>
              </div>
            </div>
          </ACol>
        </ARow>
      </AImagePreviewGroup>
    </template>

    <AFlex
      v-else
      :gap="16"
    >
      <div
        v-for="(image, index) in Array.from(Array(3))"
        :key="index"
        :class="$style.preview"
      >
        <div :class="$style.imageContainer">
          <AImage
            :class="$style.image"
            :preview="false"
            src="/img/no-img.webp"
            width="100%"
            height="100%"
          />
        </div>
      </div>
    </AFlex>
  </AFlex>
</template>

<style module lang="scss">
  .upload {
    color: currentColor;
  }

  .preview {
    position: relative;

    overflow: hidden;

    width: 100%;

    background-color: var(--color-hover);
    border-radius: 8px;

    &:before {
      pointer-events: none;
      content: '';
      user-select: none;

      position: relative;

      display: block;

      width: 100%;
      padding-bottom: 75%;
    }

    .imageContainer {
      position: absolute;
      top: 0;
      left: 0;

      width: 100%;
      height: 100%;

      .image {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    .controls {
      pointer-events: none;

      position: absolute;
      top: 0;
      left: 0;

      display: flex;
      gap: 4px;
      justify-content: flex-end;

      width: 100%;
      padding: 4px;

      opacity: 0;

      & {
        @include css-anim();
      }
    }

    &:hover {
      .controls {
        opacity: 1;

        & > * {
          pointer-events: auto;
        }
      }
    }
  }
</style>
