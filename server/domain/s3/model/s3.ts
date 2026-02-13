export interface S3UploadFile {
  name: string;
  path: string;
  type: string;
  data: Buffer;
}

export interface S3UploadResponse {
  filename: string;
  url: string;
}
