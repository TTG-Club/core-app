<script setup lang="ts">
  import { HomeBackground } from '~/features/home/background';
  import {
    ProfileTabItems,
    ProfileTabs,
  } from '~/features/user/profile-page/model';
  import {
    TabConnections,
    TabGeneral,
    TabSecurity,
    TabStatistics,
  } from '~/features/user/profile-page/ui';

  import type { UserProfile } from '~/shared/types';

  const { data: profile } = await useAsyncData(
    'user-profile',
    () => $fetch<UserProfile>('/api/user/profile'),
    { dedupe: 'defer' },
  );

  /**
   * Активный таб
   */
  const activeTab = ref<string>(ProfileTabs.GENERAL);

  useSeoMeta({
    title: 'Профиль пользователя',
  });
</script>

<template>
  <NuxtLayout>
    <div class="relative min-h-[calc(100vh-var(--header-height))] pb-20">
      <ClientOnly>
        <HomeBackground />
      </ClientOnly>

      <UContainer class="relative z-10 pt-6">
        <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <!-- Sidebar: Profile Info -->
          <div class="flex flex-col gap-6 lg:col-span-4">
            <UCard
              class="shadow-2xl"
              :ui="{ body: '!p-0' }"
            >
              <div class="relative flex flex-col items-center p-8 text-center">
                <!-- Avatar with glow -->
                <div class="group relative mb-6">
                  <div
                    class="absolute inset-0 rounded-full bg-primary-500/30 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                  />

                  <UAvatar
                    :alt="profile?.username"
                    size="3xl"
                    class="relative z-10 h-32 w-32 text-4xl shadow-2xl ring-4 ring-gray-950"
                  />

                  <UButton
                    size="xs"
                    color="neutral"
                    variant="solid"
                    icon="i-fluent-camera-edit-24-regular"
                    class="absolute right-1 bottom-1 z-20 translate-y-2 rounded-full opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
                  />
                </div>

                <h2 class="mb-2 text-3xl font-bold tracking-tight text-white">
                  {{ profile?.username || 'Путешественник' }}
                </h2>

                <div class="mb-6 flex items-center gap-2">
                  <UBadge
                    color="primary"
                    variant="subtle"
                    size="md"
                    >Игрок</UBadge
                  >

                  <span class="text-gray-500">•</span>

                  <span class="font-medium text-gray-400">{{
                    profile?.email
                  }}</span>
                </div>

                <!-- Mini Stats -->
                <div
                  class="grid w-full grid-cols-3 gap-px overflow-hidden rounded-xl border border-gray-800/50 bg-gray-800/50"
                >
                  <div
                    class="cursor-default p-3 transition-colors hover:bg-white/5"
                  >
                    <div class="text-xl font-bold text-white">12</div>

                    <div
                      class="text-[10px] font-semibold tracking-wider text-gray-500 uppercase"
                    >
                      Уровень
                    </div>
                  </div>

                  <div
                    class="cursor-default p-3 transition-colors hover:bg-white/5"
                  >
                    <div class="text-xl font-bold text-white">4</div>

                    <div
                      class="text-[10px] font-semibold tracking-wider text-gray-500 uppercase"
                    >
                      Персонажа
                    </div>
                  </div>

                  <div
                    class="cursor-default p-3 transition-colors hover:bg-white/5"
                  >
                    <div class="text-xl font-bold text-white">28</div>

                    <div
                      class="text-[10px] font-semibold tracking-wider text-gray-500 uppercase"
                    >
                      Заметок
                    </div>
                  </div>
                </div>
              </div>
            </UCard>

            <!-- Navigation Deskrop -->
            <nav class="hidden flex-col gap-1 lg:flex">
              <UButton
                v-for="item in ProfileTabItems"
                :key="item.value"
                :label="item.label"
                :icon="item.icon"
                :variant="activeTab === item.value ? 'solid' : 'ghost'"
                :color="activeTab === item.value ? 'primary' : 'neutral'"
                size="lg"
                class="justify-start px-6"
                block
                @click="activeTab = item.value"
              />
            </nav>
          </div>

          <!-- Main Content -->
          <div class="flex flex-col gap-6 lg:col-span-8">
            <!-- Mobile Navigation -->
            <div class="lg:hidden">
              <USelectMenu
                v-model="activeTab"
                :options="ProfileTabItems"
                option-attribute="label"
                value-attribute="value"
                size="lg"
              >
                <template #leading>
                  <UIcon
                    :name="
                      ProfileTabItems.find((i) => i.value === activeTab)?.icon
                    "
                  />
                </template>
              </USelectMenu>
            </div>

            <!-- Content Area -->
            <div class="min-h-[400px]">
              <Transition
                mode="out-in"
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="transform translate-y-2 opacity-0"
                enter-to-class="transform translate-y-0 opacity-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="transform translate-y-0 opacity-100"
                leave-to-class="transform translate-y-2 opacity-0"
              >
                <div :key="activeTab">
                  <TabGeneral
                    v-if="activeTab === ProfileTabs.GENERAL"
                    :profile="profile"
                  />

                  <TabSecurity v-if="activeTab === ProfileTabs.SECURITY" />

                  <TabStatistics v-if="activeTab === ProfileTabs.STATISTICS" />

                  <TabConnections
                    v-if="activeTab === ProfileTabs.CONNECTIONS"
                  />
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </UContainer>
    </div>
  </NuxtLayout>
</template>
