<script setup lang="ts">
  import type { PolymorpherGameCard } from '~/shared/types/polymorpher';

  const { game } = defineProps<{
    game: PolymorpherGameCard;
  }>();

  const isOpen = ref(false);

  const previewImageUrl = computed(() => game.imageUrl ?? undefined);

  computed(() => game.bigImageUrl ?? game.imageUrl ?? undefined);

  const maxPlayers = computed(() => game.maxPlayerCount ?? 0);
  const currentPlayers = computed(() => game.currentPlayersCount ?? 0);
  const minPlayers = computed(() => game.minPlayerCount ?? 0);

  function openSlideover(): void {
    isOpen.value = true;
  }
</script>

<template>
  <article
    class="relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-default bg-elevated shadow-sm transition-colors hover:border-primary/40"
    role="region"
    tabindex="0"
    @click="openSlideover"
    @keydown.enter.prevent="openSlideover"
    @keydown.space.prevent="openSlideover"
  >
    <div
      v-if="game.priceLabel"
      class="absolute top-2 right-2 z-10"
    >
      <span
        class="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold shadow-sm backdrop-blur"
        :class="
          game.priceLabel === 'Бесплатно'
            ? 'bg-green-600 text-white'
            : 'bg-black/70 text-white'
        "
      >
        <template v-if="game.priceLabel !== 'Бесплатно'">
          <span
            class="flex h-4 w-4 items-center justify-center rounded bg-orange-600 text-[10px] font-bold text-white"
          >
            R
          </span>
        </template>

        {{ game.priceLabel }}
      </span>
    </div>

    <div class="aspect-[16/9] bg-muted sm:aspect-[16/8]">
      <img
        v-if="previewImageUrl"
        :src="previewImageUrl"
        :alt="game.title"
        class="h-full w-full object-cover"
      />

      <div
        v-else
        class="flex h-full items-center justify-center text-sm text-muted"
      >
        Нет изображения
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-4">
      <div class="space-y-2">
        <h2
          class="line-clamp-2 text-sm font-semibold text-highlighted sm:text-base"
        >
          {{ game.title }}
        </h2>

        <div class="flex flex-wrap gap-1.5 sm:gap-2">
          <UBadge
            v-if="game.system"
            variant="subtle"
            size="sm"
          >
            {{ game.system }}
          </UBadge>

          <UBadge
            v-if="game.format"
            variant="subtle"
            size="sm"
          >
            {{ game.format }}
          </UBadge>

          <UBadge
            v-if="game.type"
            variant="subtle"
            size="sm"
          >
            {{ game.type }}
          </UBadge>

          <UBadge
            v-if="game.genre"
            variant="subtle"
            size="sm"
            class="max-w-full"
          >
            <span class="truncate">
              {{ game.genre }}
            </span>
          </UBadge>
        </div>
      </div>

      <div class="mt-auto grid gap-1 text-xs text-toned sm:text-sm">
        <div
          v-if="game.masterName"
          class="truncate"
        >
          <strong>Мастер:</strong> {{ game.masterName }}
        </div>

        <UTooltip>
          <template #content>
            <div class="text-xs">
              <div>Текущие: {{ currentPlayers }}</div>

              <div>Минимум: {{ minPlayers }}</div>

              <div>Максимум: {{ maxPlayers }}</div>
            </div>
          </template>

          <div class="flex cursor-help items-center gap-1">
            <UIcon
              v-for="index in maxPlayers"
              :key="index"
              :name="
                index <= currentPlayers
                  ? 'i-tabler-user-filled'
                  : 'i-tabler-user'
              "
              class="h-4 w-4 shrink-0"
              :class="[
                index <= currentPlayers
                  ? 'text-primary'
                  : index <= minPlayers
                    ? 'text-muted'
                    : 'text-muted opacity-20',
              ]"
            />
          </div>
        </UTooltip>
      </div>
    </div>

    <USlideover
      v-model:open="isOpen"
      :title="game.title"
      :ui="{
        content: 'w-full max-w-full sm:max-w-xl',
        body: 'p-4 sm:p-6',
        header: 'px-4 py-3 sm:px-6 sm:py-4',
        footer: 'px-4 py-3 sm:px-6 sm:py-4',
      }"
    >
      <template #body>
        <div class="space-y-4">
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-if="game.system"
              variant="subtle"
            >
              {{ game.system }}
            </UBadge>

            <UBadge
              v-if="game.format"
              variant="subtle"
            >
              {{ game.format }}
            </UBadge>

            <UBadge
              v-if="game.type"
              variant="subtle"
            >
              {{ game.type }}
            </UBadge>

            <UBadge
              v-if="game.genre"
              variant="subtle"
            >
              {{ game.genre }}
            </UBadge>
          </div>

          <p
            v-if="game.description"
            class="text-sm whitespace-pre-line text-toned"
          >
            {{ game.description }}
          </p>

          <div class="grid gap-2 text-sm text-toned">
            <div v-if="game.masterName">
              <strong>Мастер:</strong> {{ game.masterName }}
            </div>

            <div v-if="game.platform">
              <strong>Платформа:</strong> {{ game.platform }}
            </div>

            <div v-if="game.startDateLabel">
              <strong>Старт:</strong> {{ game.startDateLabel }}
            </div>

            <div v-if="game.playersLabel">
              <strong>Игроки:</strong> {{ game.playersLabel }}
            </div>

            <div v-if="game.ageLabel">
              <strong>Возраст:</strong> {{ game.ageLabel }}
            </div>

            <div v-if="game.setting">
              <strong>Сеттинг:</strong> {{ game.setting }}
            </div>

            <div v-if="game.city"><strong>Город:</strong> {{ game.city }}</div>

            <div v-if="game.priceLabel">
              <strong>Цена:</strong> {{ game.priceLabel }}
            </div>
          </div>

          <div
            v-if="game.playerRequirements"
            class="space-y-1"
          >
            <div class="text-sm font-medium text-highlighted">Требования</div>

            <p class="text-sm whitespace-pre-line text-toned">
              {{ game.playerRequirements }}
            </p>
          </div>
        </div>
      </template>

      <template #footer>
        <UButton
          :to="game.joinUrl"
          target="_self"
          block
          @click.stop
        >
          Присоединиться
        </UButton>
      </template>
    </USlideover>
  </article>
</template>
