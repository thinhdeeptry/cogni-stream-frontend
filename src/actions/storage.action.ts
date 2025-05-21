"use server";

import { AxiosFactory } from "@/lib/axios";

const storageAxios = await AxiosFactory.getApiInstance("storage");

interface UploadResponse {
  url: string;
  path: string;
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

/**
 * Upload a single file to storage
 * @param file The file to upload
 * @param bucket Optional bucket name (default: 'avatars')
 * @param folder Optional folder path within the bucket
 */
export async function uploadFile(
  file: File,
  bucket: string = "avatars",
  folder?: string,
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", bucket);
  if (folder) {
    formData.append("folder", folder);
  }

  const { data } = await storageAxios.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
}

/**
 * Upload multiple files to storage
 * @param files Array of files to upload
 * @param bucket Optional bucket name (default: 'avatars')
 * @param folder Optional folder path within the bucket
 */
export async function uploadMultipleFiles(
  files: File[],
  bucket: string = "avatars",
  folder?: string,
): Promise<UploadResponse[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });
  formData.append("bucket", bucket);
  if (folder) {
    formData.append("folder", folder);
  }

  const { data } = await storageAxios.post("/upload-multiple", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
}

/**
 * Delete a file by its URL
 * @param url The public URL of the file to delete
 */
export async function deleteFile(url: string): Promise<DeleteResponse> {
  const { data } = await storageAxios.post("/delete", { url });
  return data;
}

/**
 * Delete multiple files by their URLs
 * @param urls Array of public URLs of the files to delete
 */
export async function deleteMultipleFiles(
  urls: string[],
): Promise<DeleteResponse> {
  const { data } = await storageAxios.post("/delete-multiple", { urls });
  return data;
}
