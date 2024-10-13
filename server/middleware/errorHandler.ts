import type { NitroErrorHandler } from 'nitropack';

const handler: NitroErrorHandler = (error, event) => {
  // TODO handle non api errors?
  setResponseHeader(event, 'Content-Type', 'application/json');
  setResponseStatus(event, error.statusCode, error.statusMessage);

  const message = error.message;
  const errData = error.data;

  console.error(error);

  return send(
    event,
    JSON.stringify({
      success: false,
      message,
      ...(errData ? { data: errData } : {}),
    }),
  );
};

export default defineNitroErrorHandler(handler);
