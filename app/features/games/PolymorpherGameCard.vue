<script setup lang="ts">
  import type { PolymorpherGameCard } from '~/shared/types/polymorpher';

  const HoursPerDay = 24;
  const MinutesPerHour = 60;

  const { game } = defineProps<{
    game: PolymorpherGameCard;
  }>();

  const { $dayjs: dayjs } = useDayjs();

  const isOpen = ref(false);

  const previewImageUrl = computed(() => game.imageUrl ?? undefined);

  const maxPlayers = computed(() => game.maxPlayerCount ?? 0);
  const currentPlayers = computed(() => game.currentPlayersCount ?? 0);
  const minPlayers = computed(() => game.minPlayerCount ?? 0);

  const shouldShowPriceBadge = computed(() => {
    return !!game.priceLabel;
  });

  const priceBadgeClasses = computed(() => {
    if (game.currency === 'FREE') {
      return 'bg-green-600 text-white';
    }

    return 'bg-black/70 text-white';
  });

  computed(() => {
    if (game.currency === 'FREE') {
      return 'Бесплатная игра';
    }

    if (game.currency === 'RESOURCE') {
      return 'Цена указана в ресурсах';
    }

    if (game.currency === 'MANA') {
      return 'Цена указана в мане';
    }

    return 'Цена игры';
  });

  const detailedPriceLabel = computed(() => {
    if (!game.priceLabel) {
      return null;
    }

    if (game.currency === 'FREE') {
      return 'Бесплатно';
    }

    if (game.currency === 'RESOURCE' && game.price !== null) {
      return `${game.price} ресурсов`;
    }

    if (game.currency === 'MANA' && game.price !== null) {
      return `${game.price} маны`;
    }

    return game.priceLabel;
  });

  const startCountdownLabel = computed(() => {
    if (!game.startDate) {
      return 'Бессрочное';
    }

    const startDate = dayjs(game.startDate);

    if (!startDate.isValid()) {
      return null;
    }

    const currentDate = dayjs();

    if (startDate.isBefore(currentDate)) {
      return null;
    }

    const totalMinutes = startDate.diff(currentDate, 'minute');

    if (totalMinutes < MinutesPerHour) {
      return 'Начало меньше чем через час';
    }

    const totalHours = Math.floor(totalMinutes / MinutesPerHour);
    const remainingDays = Math.floor(totalHours / HoursPerDay);
    const remainingHours = totalHours % HoursPerDay;

    const countdownParts: string[] = [];

    if (remainingDays > 0) {
      countdownParts.push(
        `${remainingDays} ${getRussianPluralForm(
          remainingDays,
          'день',
          'дня',
          'дней',
        )}`,
      );
    }

    if (remainingHours > 0) {
      countdownParts.push(
        `${remainingHours} ${getRussianPluralForm(
          remainingHours,
          'час',
          'часа',
          'часов',
        )}`,
      );
    }

    if (!countdownParts.length) {
      return 'Начало меньше чем через час';
    }

    if (countdownParts.length === 1) {
      return `Начало через ${countdownParts[0]}`;
    }

    return `Начало через ${countdownParts[0]} и ${countdownParts[1]}`;
  });

  function openSlideover(): void {
    isOpen.value = true;
  }

  function getRussianPluralForm(
    amount: number,
    singularForm: string,
    paucalForm: string,
    pluralForm: string,
  ): string {
    const lastTwoDigits = amount % 100;
    const lastDigit = amount % 10;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return pluralForm;
    }

    if (lastDigit === 1) {
      return singularForm;
    }

    if (lastDigit >= 2 && lastDigit <= 4) {
      return paucalForm;
    }

    return pluralForm;
  }

  const url = computed(() => `/polymorpher/join?target=${game.shareUrl}`);
</script>

<template>
  <article
    class="relative flex h-full cursor-pointer flex-col overflow-hidden rounded-md border border-default bg-elevated shadow-sm transition-colors hover:border-primary/40"
    role="region"
    tabindex="0"
    @click.left.exact.prevent="openSlideover"
    @keydown.enter.prevent="openSlideover"
    @keydown.space.prevent="openSlideover"
  >
    <div
      v-if="shouldShowPriceBadge"
      class="absolute top-2 right-2 z-10"
    >
      <span
        class="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold shadow-sm backdrop-blur"
        :class="priceBadgeClasses"
      >
        <template v-if="game.currency === 'FREE'">
          {{ game.priceLabel }}
        </template>

        <template v-else-if="game.currency === 'RESOURCE'">
          <span
            class="flex h-4 w-4 items-center justify-center rounded bg-red-600 text-[10px] font-bold text-white"
          >
            R
          </span>

          {{ game.price }}
        </template>

        <template v-else-if="game.currency === 'MANA'">
          <UIcon
            name="i-fluent-emoji-flat-gem-stone"
            class="h-4 w-4 shrink-0"
          />

          {{ game.price }}
        </template>

        <template v-else>
          {{ game.priceLabel }}
        </template>
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
          v-if="game.startDate"
          class="flex items-center gap-2 text-xs text-toned sm:text-sm"
        >
          <UIcon
            name="i-tabler-clock"
            class="h-4 w-4 shrink-0 text-muted"
          />

          <span class="truncate">
            {{ game.startDateLabel }}
          </span>
        </div>

        <div class="flex items-center gap-1">
          <UIcon
            v-for="index in maxPlayers"
            :key="index"
            :name="
              index <= currentPlayers ? 'i-tabler-user-filled' : 'i-tabler-user'
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

          <div class="grid gap-2 text-sm text-toned">
            <div v-if="game.masterName">
              <strong>Мастер:</strong> {{ game.masterName }}
            </div>

            <div v-if="game.platform">
              <strong>Платформа:</strong> {{ game.platform }}
            </div>

            <div v-if="game.startDateLabel">
              <strong>Старт:</strong>

              {{ game.startDateLabel }}
              ({{ startCountdownLabel }})
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

            <div v-if="detailedPriceLabel">
              <strong>Цена:</strong> {{ detailedPriceLabel }}
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

          <div
            v-if="game.description"
            class="text-sm whitespace-pre-line text-toned"
          >
            <div class="text-sm font-medium text-highlighted">Описание</div>

            {{ game.description }}
          </div>
        </div>
      </template>

      <template #footer>
        <UButton
          :to="url"
          target="_blank"
          block
        >
          Присоединиться
        </UButton>
      </template>
    </USlideover>
  </article>
</template>
