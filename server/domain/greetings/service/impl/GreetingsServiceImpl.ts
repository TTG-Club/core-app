import { random } from 'lodash-es';
import type { GreetingsResponse } from '../../dto';
import { GreetingsRepository } from '../../repository';
import type { GreetingsService } from '../GreetingsService';
import { StatusCodes } from 'http-status-codes';

class GreetingsServiceImpl implements GreetingsService {
  getRandomGreeting = (): GreetingsResponse => {
    const character = GreetingsRepository.getRandomCharacter();

    if (!character) {
      throw createError(getErrorResponse(StatusCodes.NOT_FOUND));
    }

    const { image, messages } = character;

    const messageIndex = random(0, messages.length - 1);
    const message = messages[messageIndex];

    if (!message) {
      throw createError(getErrorResponse(StatusCodes.NOT_FOUND));
    }

    return {
      image,
      message,
    };
  };
}

export default new GreetingsServiceImpl();
