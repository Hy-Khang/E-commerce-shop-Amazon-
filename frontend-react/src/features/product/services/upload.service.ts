import { api } from '@/core/api/axios-instance';
import type { SuccessResponse } from '@/core/api/api.types';

export interface UploadImageResponse {
  url: string;
}

export const uploadService = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.postForm<SuccessResponse<UploadImageResponse>>(
      '/upload/image',
      formData,
    );
  },
};
