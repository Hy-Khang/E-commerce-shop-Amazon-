import { useMutation } from '@tanstack/react-query';
import { uploadService } from '../services/upload.service';
import { showErrorToast } from '@/common/components/feedback/toast';
import { useTranslation } from 'react-i18next';

export function useUploadImage() {
  const { t } = useTranslation('toast');

  return useMutation({
    mutationFn: (file: File) =>
      uploadService.uploadImage(file).then((res) => res.data.data),
    onError: (error) => {
      showErrorToast(error, t('upload.error'));
    },
  });
}
