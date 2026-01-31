import type { GreetingsResponse } from '../dto';

export interface GreetingsService {
  getRandomGreeting: () => GreetingsResponse;
}
