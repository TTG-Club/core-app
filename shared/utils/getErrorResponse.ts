import type { StatusCodes } from 'http-status-codes';
import type { NuxtError } from '#app';
import { getReasonPhrase } from 'http-status-codes';

export const getErrorResponse = <DataT = unknown>(
  code: StatusCodes,
  err?: Omit<Partial<NuxtError<DataT>>, 'statusCode'>,
): Partial<NuxtError<DataT>> => ({
  statusCode: code,
  message: getReasonPhrase(code),
  ...err,
});
