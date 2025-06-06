import { getReasonPhrase } from 'http-status-codes';

import { getStatusMessage } from './getStatusMessage';

import type { NuxtError } from '#app';
import type { StatusCodes } from 'http-status-codes';

export const getErrorResponse = <DataT = unknown>(
  code: StatusCodes,
  err?: Omit<Partial<NuxtError<DataT>>, 'statusCode'>,
): Partial<NuxtError<DataT>> => ({
  statusCode: code,
  statusMessage: getReasonPhrase(code),
  message: getStatusMessage(code),
  ...err,
});
