import { GREETINGS_CHARACTERS } from '../const';
import type { GreetingsCharacter } from '../model';
import { random } from 'lodash-es';

class GreetingsRepository {
  getRandomCharacter = (): GreetingsCharacter | undefined => {
    const characterIndex = random(0, GREETINGS_CHARACTERS.length - 1);

    return GREETINGS_CHARACTERS[characterIndex];
  };
}

export default new GreetingsRepository();
