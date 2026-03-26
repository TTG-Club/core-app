<script setup lang="ts">
  import type { PolymorpherGameCard } from '~/shared/types/polymorpher';

  const { game } = defineProps<{
    game: PolymorpherGameCard;
  }>();

  const isOpen = ref(false);

  const previewImageUrl = computed(() => game.imageUrl ?? undefined);

  computed(() => game.bigImageUrl ?? game.imageUrl ?? undefined);

  function openSlideover(): void {
    isOpen.value = true;
  }
</script>

<template>
  <article
    class="flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-default bg-elevated shadow-sm transition-colors hover:border-primary/40"
    role="region"
    tabindex="0"
    @click.left.exact.prevent="openSlideover"
    @keydown.enter.prevent="openSlideover"
    @keydown.space.prevent="openSlideover"
  >
    <div class="aspect-[16/8] bg-muted">
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

    <div class="flex flex-1 flex-col gap-3 p-4">
      <div class="space-y-2">
        <h2 class="line-clamp-2 text-base font-semibold text-highlighted">
          {{ game.title }}
        </h2>

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
      </div>

      <div class="grid gap-1 text-sm text-toned">
        <div v-if="game.playersLabel">Игроки: {{ game.playersLabel }}</div>

        <div v-if="game.priceLabel">Цена: {{ game.priceLabel }}</div>
      </div>
    </div>

    <USlideover
      v-model:open="isOpen"
      :title="game.title"
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

          <p
            v-if="game.description"
            class="text-sm whitespace-pre-line text-toned"
          >
            {{ game.description }}
          </p>
        </div>
      </template>

      <template #footer>
        <UButton
          :to="game.joinUrl"
          target="_self"
          block
        >
          Присоединиться
        </UButton>
      </template>
    </USlideover>
  </article>
</template>
