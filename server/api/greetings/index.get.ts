import { GREETINGS_CHARACTERS } from '~~/server/const/greetings';
import type { GreetingsResponse } from '~~/server/types/greetings';
import { StatusCodes } from 'http-status-codes';
import { random } from 'lodash-es';

export default defineEventHandler<GreetingsResponse>(() => {
  const characterIndex = random(0, GREETINGS_CHARACTERS.length - 1);
  const character = GREETINGS_CHARACTERS[characterIndex];

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
});
