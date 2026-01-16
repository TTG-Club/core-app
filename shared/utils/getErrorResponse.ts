import { getReasonPhrase } from 'http-status-codes';

import { getStatusMessage } from './getStatusMessage';

import type { StatusCodes } from 'http-status-codes';

import type { NuxtError } from '#app';

export function getErrorResponse<DataT = unknown>(
  code: StatusCodes,
  err?: Omit<Partial<NuxtError<DataT>>, 'statusCode'>,
): Partial<NuxtError<DataT>> {
  return {
    statusCode: code,
    statusMessage: getReasonPhrase(code),
    message: getStatusMessage(code),
    ...err,
  };
}
