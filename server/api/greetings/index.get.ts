import { GreetingsService } from '#server/domain/greetings';

import type { GreetingsResponse } from '#server/domain/greetings';

export default defineEventHandler<GreetingsResponse>(() =>
  GreetingsService.getRandomGreeting(),
);
