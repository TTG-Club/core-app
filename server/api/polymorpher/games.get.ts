import type {
  PolymorpherApiGame,
  PolymorpherGameCard,
  PolymorpherGamesApiResponse,
  PolymorpherGamesResponse,
} from '~/shared/types/polymorpher';

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function notNull<T>(value: T | null): value is T {
  return value !== null;
}

function formatPrice(
  price: number | null,
  currency: string | null,
): string | null {
  if (currency === 'FREE' || price === null || price === 0) {
    return 'Бесплатно';
  }

  if (currency === 'RESOURCE') {
    return `${price}`;
  }

  return `${price}`;
}

function formatPlayers(
  minPlayerCount: number | null,
  maxPlayerCount: number | null,
  currentPlayersCount: number | null,
): string | null {
  if (minPlayerCount !== null && maxPlayerCount !== null) {
    return `${currentPlayersCount ?? 0}/${maxPlayerCount} игроков`;
  }

  if (maxPlayerCount !== null) {
    return `${currentPlayersCount ?? 0}/${maxPlayerCount} игроков`;
  }

  if (currentPlayersCount !== null) {
    return `${currentPlayersCount} игроков`;
  }

  return null;
}

function formatAge(
  minPlayerAge: number | null,
  maxPlayerAge: number | null,
): string | null {
  if (minPlayerAge !== null && maxPlayerAge !== null) {
    return `${minPlayerAge}–${maxPlayerAge}`;
  }

  if (minPlayerAge !== null) {
    return `${minPlayerAge}+`;
  }

  return null;
}

function formatStartDate(startDate: string | null): string | null {
  if (!startDate) {
    return null;
  }

  const date = new Date(startDate);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function mapGame(item: PolymorpherApiGame): PolymorpherGameCard | null {
  const id = asString(item.id);

  if (!id) {
    return null;
  }

  const currency = asString(item.currency);
  const price = asNumber(item.price);
  const startDate = asString(item.startDate);
  const minPlayerCount = asNumber(item.minPlayerCount);
  const maxPlayerCount = asNumber(item.maxPlayerCount);
  const currentPlayersCount = asNumber(item.currentPlayersCount);
  const minPlayerAge = asNumber(item.minPlayerAge);
  const maxPlayerAge = asNumber(item.maxPlayerAge);
  const shareUrl = asString(item.shareUrl);

  return {
    id,
    title: asString(item.title) ?? 'Без названия',
    masterName: asString(item.masterName),
    description: asString(item.description),
    format: asString(item.format),
    type: asString(item.type),
    system: asString(item.system),
    genre: asString(item.genre),
    platform: asString(item.platform),
    city: asString(item.city),
    setting: asString(item.setting),
    status: asString(item.status),
    price,
    priceLabel: formatPrice(price, currency),
    currency,
    startDate,
    startDateLabel: formatStartDate(startDate),
    timeComment: asString(item.timeComment),
    minPlayerCount,
    maxPlayerCount,
    currentPlayersCount,
    playersLabel: formatPlayers(
      minPlayerCount,
      maxPlayerCount,
      currentPlayersCount,
    ),
    minPlayerAge,
    maxPlayerAge,
    ageLabel: formatAge(minPlayerAge, maxPlayerAge),
    imageUrl: asString(item.imageUrl),
    bigImageUrl: asString(item.bigImageUrl),
    shareUrl,
    isHighlighted: Boolean(item.isHighlighted),
    playerRequirements: asString(item.playerRequirements),
  };
}

export default defineEventHandler(
  async (event): Promise<PolymorpherGamesResponse> => {
    const query = getQuery(event);

    const page = Math.max(
      0,
      Number.parseInt(String(query.page ?? '0'), 10) || 0,
    );

    const size = Math.max(
      1,
      Number.parseInt(String(query.size ?? '8'), 10) || 8,
    );

    const search = asString(query.search);
    const seed = asString(query.seed);

    const config = useRuntimeConfig(event);

    const response = await $fetch<PolymorpherGamesApiResponse>(
      `${config.polymorpher.apiBase}/games/public`,
      {
        query: {
          page,
          size,
          ...(search ? { search } : {}),
          ...(seed ? { seed } : {}),
        },
      },
    );

    const items: PolymorpherApiGame[] = Array.isArray(response.items)
      ? response.items
      : [];

    const content: PolymorpherGameCard[] = items.map(mapGame).filter(notNull);

    return {
      content,
      totalPages: response.totalPages,
      totalElements: response.totalElements,
      size,
      page: response.page,
    };
  },
);
