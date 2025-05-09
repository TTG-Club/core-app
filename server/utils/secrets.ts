export function getSecrets() {
  return {
    s3: getS3Secrets(),
    api: getApiSecrets(),
  };
}

// Получение секретов S3
export function getS3Secrets() {
  const {
    NITRO_S3_ENDPOINT: endpoint = '',
    NITRO_S3_REGION: region = '',
    NITRO_S3_ACCESS_KEY_ID: accessKeyId = '',
    NITRO_S3_SECRET_ACCESS_KEY: secretAccessKey = '',
    NITRO_S3_BUCKET: bucket = '',
  } = process.env;

  if (!endpoint || !region || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('[S3] Variables are not set');
  }

  return {
    endpoint,
    region,
    accessKeyId,
    secretAccessKey,
    bucket,
  };
}

// Получение секретов API
export function getApiSecrets() {
  const {
    NITRO_API_URL: url = '',
    NITRO_API_TOKEN: token = '',
    NITRO_API_SECRET: secret = '',
  } = process.env;

  if (!url || !token || !secret) {
    throw new Error('[API] Variables are not set');
  }

  return {
    url,
    token,
    secret,
  };
}
