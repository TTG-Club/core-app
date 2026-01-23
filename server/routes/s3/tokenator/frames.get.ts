import { S3Service } from '~~/server/services';

import type { Readable } from 'node:stream';

// Helper to read stream
function streamToString(stream: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];

    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

export default defineEventHandler(async () => {
  try {
    // 1. List all actual files in S3
    const objects = await S3Service.list('tokenator/');

    // Filter and Sort by Date (newest first) as default/fallback
    const allFrames = objects
      .filter((obj) => {
        if (!obj.Key || obj.Key.endsWith('/')) {
          return false;
        }

        const key = obj.Key.toLowerCase();

        return (
          key.endsWith('.png') ||
          key.endsWith('.jpg') ||
          key.endsWith('.jpeg') ||
          key.endsWith('.webp')
        );
      })
      .sort((a, b) => {
        const dateA = a.LastModified ? new Date(a.LastModified).getTime() : 0;
        const dateB = b.LastModified ? new Date(b.LastModified).getTime() : 0;

        return dateB - dateA;
      })
      .map((obj) => `/s3/${obj.Key}`);

    // 2. Try to get manifest
    let orderedFrames: string[] = [];

    try {
      const manifestObj = await S3Service.get('tokenator/manifest.json');

      if (manifestObj.Body) {
        const manifestStr = await streamToString(manifestObj.Body as Readable);

        orderedFrames = JSON.parse(manifestStr);
      }
    } catch {
      // Manifest not found or error reading - ignore, use default order
    }

    // 3. Merge orders
    if (orderedFrames.length > 0) {
      const allFramesSet = new Set(allFrames);
      const orderedSet = new Set(orderedFrames);

      // A. Existing ordered frames (remove deleted ones)
      const validOrderedFrames = orderedFrames.filter((url) =>
        allFramesSet.has(url),
      );

      // B. New frames (not in manifest)
      const newFrames = allFrames.filter((url) => !orderedSet.has(url));

      // Result: Ordered frames first, new frames at the end
      return [...validOrderedFrames, ...newFrames];
    }

    return allFrames;
  } catch (error) {
    console.error('[Tokenator] Error fetching frames:', error);

    throw createError({
      statusCode: 500,
      message: 'Failed to fetch frames',
    });
  }
});
