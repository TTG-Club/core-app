import { S3Service } from '~~/server/services';

export default defineEventHandler(async (event) => {
  const body = await readBody<{ frames: string[] }>(event);

  if (!body.frames || !Array.isArray(body.frames)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid frames list',
    });
  }

  try {
    const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];

    // Filter out invalid URLs (non-images like manifest.json)
    const validFrames = body.frames.filter((url) => {
      const lowerUrl = url.toLowerCase();

      return ALLOWED_EXTENSIONS.some((ext) => lowerUrl.endsWith(ext));
    });

    const jsonContent = JSON.stringify(validFrames);
    const buffer = Buffer.from(jsonContent, 'utf-8');

    await S3Service.upload({
      name: 'manifest.json',
      data: buffer,
      type: 'application/json',
      path: 'tokenator/manifest.json',
    });

    return { success: true };
  } catch (error) {
    console.error('[Tokenator] Error saving frames order:', error);

    throw createError({
      statusCode: 500,
      message: 'Failed to save frames order',
    });
  }
});
