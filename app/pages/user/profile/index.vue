<script setup lang="ts">
  import type { UserProfile } from '~/shared/types';
  import { PageContainer, PageHeader, UiGallery } from '~/shared/ui';

  const { data } = await useAsyncData('user-profile', () =>
    $fetch<UserProfile>('/api/user/profile'),
  );

  useSeoMeta({
    title: 'Профиль пользователя',
  });

  const activeKeys = ref(['default']);
</script>

<template>
  <PageContainer>
    <template #header>
      <PageHeader title="Профиль пользователя" />
    </template>

    <template #default>
      <AFlex
        :gap="28"
        align="flex-start"
      >
        <AFlex
          :gap="16"
          :class="$style.left"
        >
          <div :class="$style.gallery">
            <UiGallery preview="/img/no-img.webp" />
          </div>
        </AFlex>

        <AFlex
          :class="$style.right"
          :gap="16"
          vertical
        >
          <ACollapse
            v-model:active-key="activeKeys"
            :bordered="false"
            expand-icon-position="end"
          >
            <ACollapsePanel key="default">
              <template #header>
                <ATypographyTitle :level="5">
                  Основная информация
                </ATypographyTitle>
              </template>

              <template #default>
                <ASkeleton :loading="!data">
                  <AFlex
                    v-if="!!data"
                    :gap="8"
                    vertical
                  >
                    <span>
                      <strong>Имя пользователя: </strong>

                      <span>
                        {{ data.username }}
                      </span>
                    </span>
                  </AFlex>
                </ASkeleton>
              </template>
            </ACollapsePanel>
          </ACollapse>
        </AFlex>
      </AFlex>
    </template>
  </PageContainer>
</template>

<style module lang="scss">
  .left {
    flex-shrink: 0;
    width: 100%;
    min-width: 288px;
    max-width: 320px;
  }

  .right {
    flex: 1 1 auto;
  }

  .gallery {
    overflow: hidden;
    border: 1px solid var(--color-border);
    border-radius: 8px;
  }
</style>
