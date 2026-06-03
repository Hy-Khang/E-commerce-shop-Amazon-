import { useMutation } from '@tanstack/react-query';
import { uploadService } from '../services/upload.service';
import { showErrorToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';

export function useUploadImage() {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (file: File) =>
      uploadService.uploadImage(file).then((res) => res.data.data),
    onError: (error) => {
      showErrorToast(error, t((m) => m.toast.upload.error));
    },
  });
}
