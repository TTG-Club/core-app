import { StatusCodes } from 'http-status-codes';
import { random } from 'lodash-es';

import { GreetingsRepository } from '../../repository';

import type { GreetingsResponse } from '../../dto';
import type { GreetingsService } from '../GreetingsService';

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
