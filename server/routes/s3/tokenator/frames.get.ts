import { S3Service } from '~~/server/services';

export default defineEventHandler(async () => {
  try {
    // List all files in the tokenator directory
    // List all files in the tokenator directory
    const objects = await S3Service.list('tokenator/');

    // Filter out folders and non-image files if necessary, and map to full URLs
    return objects
      .filter((obj) => obj.Key && !obj.Key.endsWith('/')) // Exclude folders
      .map((obj) => `/s3/${obj.Key}`);
  } catch (error) {
    console.error('[Tokenator] Error fetching frames:', error);

    throw createError({
      statusCode: 500,
      message: 'Failed to fetch frames',
    });
  }
});
