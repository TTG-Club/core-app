import type { GreetingsCharacter } from '../model';

import { randomInt } from 'es-toolkit';

import { GREETINGS_CHARACTERS } from '../const';

class GreetingsRepository {
  getRandomCharacter = (): GreetingsCharacter | undefined => {
    const characterIndex = randomInt(0, GREETINGS_CHARACTERS.length - 1);

    return GREETINGS_CHARACTERS[characterIndex];
  };
}

export default new GreetingsRepository();
