import type { H3Event } from 'h3';

export const getRequestOrigin = (event: H3Event): string =>
  `${getRequestProtocol(event)}://${getRequestHost(event)}`;
