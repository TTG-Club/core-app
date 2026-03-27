export interface PolymorpherApiGame {
  id: string;
  masterId: string;
  masterName: string;
  title: string;
  price: number | null;
  currency: string | null;
  startDate: string | null;
  format: string | null;
  description: string | null;
  minPlayerCount: number | null;
  maxPlayerCount: number | null;
  currentPlayersCount: number | null;
  timeComment: string | null;
  minPlayerAge: number | null;
  maxPlayerAge: number | null;
  platform: string | null;
  imageUrl: string | null;
  bigImageUrl: string | null;
  dopInfoImageUrl: string | null;
  boundUrl: string | null;
  backFrameUrl: string | null;
  logoUrl: string | null;
  type: string | null;
  system: string | null;
  systemLabelId: string | null;
  systemLabelUrl: string | null;
  additionalInfo: string | null;
  setting: string | null;
  city: string | null;
  genre: string | null;
  playerStartLevel: string | null;
  playerRequirements: string | null;
  status: string | null;
  isHighlighted: boolean | null;
  isTest: boolean | null;
  shareUrl: string | null;
}

export interface PolymorpherGamesApiResponse {
  items: Array<PolymorpherApiGame>;
  page: number;
  seed: string | null;
  hasNext: boolean;
  totalElements: number;
  totalPages: number;
  excludeIds: Array<string> | null;
}

export interface PolymorpherGameCard {
  id: string;
  title: string;
  masterName: string | null;
  description: string | null;
  format: string | null;
  type: string | null;
  system: string | null;
  genre: string | null;
  platform: string | null;
  city: string | null;
  setting: string | null;
  status: string | null;
  price: number | null;
  priceLabel: string | null;
  currency: string | null;
  playerRequirements: string | null;
  startDate: string | null;
  startDateLabel: string | null;
  timeComment: string | null;
  minPlayerCount: number | null;
  maxPlayerCount: number | null;
  currentPlayersCount: number | null;
  playersLabel: string | null;
  minPlayerAge: number | null;
  maxPlayerAge: number | null;
  ageLabel: string | null;
  imageUrl: string | null;
  bigImageUrl: string | null;
  shareUrl: string | null;
  isHighlighted: boolean;
}

export interface PolymorpherGamesResponse {
  content: Array<PolymorpherGameCard>;
  totalPages: number;
  totalElements: number;
  size: number;
  page: number;
}
