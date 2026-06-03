import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, X, Link } from 'lucide-react';
import { useUploadImage } from '../hooks/useUploadImage';
import { showWarningToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ImageUploadProps {
  value?: string;
  onUploaded: (url: string) => void;
  onClear?: () => void;
  label?: string;
}

export function ImageUpload({ value, onUploaded, onClear, label }: ImageUploadProps) {
  const { t } = useTranslation();
  const uploadImage = useUploadImage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!ACCEPTED_TYPES.includes(file.type)) {
        showWarningToast(t((m) => m.toast.upload.invalidType));
        e.target.value = '';
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        showWarningToast(t((m) => m.toast.upload.tooLarge));
        e.target.value = '';
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      uploadImage.mutate(file, {
        onSuccess: (data) => {
          onUploaded(data.url);
          setPreview(null);
          URL.revokeObjectURL(objectUrl);
        },
        onError: () => {
          setPreview(null);
          URL.revokeObjectURL(objectUrl);
        },
      });

      e.target.value = '';
    },
    [uploadImage, onUploaded, t],
  );

  const handleUrlSubmit = useCallback(() => {
    const trimmed = urlValue.trim();
    if (!trimmed) return;
    onUploaded(trimmed);
    setUrlValue('');
    setShowUrlInput(false);
  }, [urlValue, onUploaded]);

  const handleClear = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    onClear?.();
  }, [preview, onClear]);

  const displayUrl = preview || value;

  if (displayUrl) {
    return (
      <div className="space-y-1">
        {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
        <div className="relative inline-block">
          <img
            src={displayUrl}
            alt={label || 'Uploaded image'}
            className="h-32 w-32 rounded-md border object-cover"
          />
          {uploadImage.isPending && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
          {!uploadImage.isPending && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute -right-2 -top-2 rounded-full bg-red-500 p-0.5 text-white shadow hover:bg-red-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
      >
        <Upload className="h-6 w-6" />
        <span>Click to upload</span>
        <span className="text-xs text-gray-400">JPEG, PNG, WebP (max 5MB)</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {showUrlInput ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlSubmit())}
            placeholder="https://..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => { setShowUrlInput(false); setUrlValue(''); }}
            className="rounded-md px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowUrlInput(true)}
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600"
        >
          <Link className="h-3 w-3" />
          Or paste URL
        </button>
      )}
    </div>
  );
}
