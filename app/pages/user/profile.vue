<script setup lang="ts">
  import { HomeBackground } from '~home/background';
  import { ProfileNavigationTabs, ProfileSidebar } from '~profile/sidebar';

  const { user: profile, fetch: fetchUserProfile } = useUser();

  await fetchUserProfile();

  useSeoMeta({
    title: 'Профиль пользователя',
    ogTitle: 'Профиль пользователя | TTG Club Онлайн-справочник',
    twitterTitle: 'Профиль пользователя | TTG Club Онлайн-справочник',
  });
</script>

<template>
  <NuxtLayout>
    <ClientOnly>
      <div class="relative min-h-[calc(100vh-var(--header-height))] pb-20">
        <HomeBackground />

        <UContainer class="relative z-10 pt-6">
          <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-16">
            <!-- Sidebar: Profile Info -->
            <div class="flex flex-col gap-6 lg:col-span-5">
              <ProfileSidebar :profile="profile ?? undefined" />

              <!-- Navigation Desktop -->
              <nav class="hidden flex-col gap-2 lg:flex">
                <ProfileNavigationTabs full />
              </nav>
            </div>

            <!-- Main Content -->
            <div class="flex flex-col gap-6 lg:col-span-11">
              <!-- Mobile Navigation -->
              <div
                class="hidden-scrollbar flex gap-2 overflow-x-auto pb-2 lg:hidden"
              >
                <ProfileNavigationTabs />
              </div>

              <!-- Content Area -->
              <NuxtPage :profile="profile ?? undefined" />
            </div>
          </div>
        </UContainer>
      </div>
    </ClientOnly>
  </NuxtLayout>
</template>
