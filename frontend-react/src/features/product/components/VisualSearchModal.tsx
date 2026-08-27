import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X, Upload, Loader2, Camera, ImageIcon } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { useVisualSearch } from '../hooks/useVisualSearch';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

type VisualSearchModalProps = {
  open: boolean;
  onClose: () => void;
};

export function VisualSearchModal({ open, onClose }: VisualSearchModalProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending, reset } = useVisualSearch();

  const handleClose = useCallback(() => {
    if (isPending) return;
    setPreview(null);
    setError(null);
    reset();
    onClose();
  }, [isPending, onClose, reset]);

  function validateAndProcess(file: File) {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('Image must be under 5MB.');
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    mutate(file, {
      onSuccess: (result) => {
        URL.revokeObjectURL(url);
        onClose();
        navigate(ROUTES.PRODUCTS, { state: { visualSearch: result } });
      },
      onError: () => {
        setError('Visual search failed. Please try again.');
      },
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) validateAndProcess(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndProcess(file);
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-md rounded-2xl bg-elevated shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border-default px-5 py-4">
              <div className="flex items-center gap-2.5">
                <Camera className="h-5 w-5 text-brand" />
                <h2 className="text-lg font-semibold text-text-primary">Search by Image</h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isPending}
                className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              {isPending ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  {preview && (
                    <img
                      src={preview}
                      alt="Uploaded"
                      className="h-32 w-32 rounded-xl object-cover border border-border-default"
                    />
                  )}
                  <Loader2 className="h-8 w-8 animate-spin text-brand" />
                  <p className="text-sm text-text-secondary">Analyzing image with AI...</p>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors ${
                    dragOver
                      ? 'border-brand bg-brand-light'
                      : 'border-border-strong hover:border-border-strong hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light">
                    {preview ? (
                      <ImageIcon className="h-7 w-7 text-brand" />
                    ) : (
                      <Upload className="h-7 w-7 text-brand" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-text-primary">
                      Drop an image here or click to browse
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      JPEG, PNG, or WebP — max 5MB
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <p className="mt-3 text-center text-sm text-error-600">{error}</p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
