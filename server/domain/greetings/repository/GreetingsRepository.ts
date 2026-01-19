import { randomInt } from 'es-toolkit';

import { GREETINGS_CHARACTERS } from '../const';

import type { GreetingsCharacter } from '../model';

class GreetingsRepository {
  getRandomCharacter = (): GreetingsCharacter | undefined => {
    const characterIndex = randomInt(0, GREETINGS_CHARACTERS.length - 1);

    return GREETINGS_CHARACTERS[characterIndex];
  };
}

export default new GreetingsRepository();
