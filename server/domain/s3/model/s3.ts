export interface S3UploadFile {
  name: string;
  path: string;
  type: string;
  data: Uint8Array;
}

export interface S3UploadResponse {
  filename: string;
  url: string;
}
