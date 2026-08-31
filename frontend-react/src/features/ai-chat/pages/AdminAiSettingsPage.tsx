import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bot, Loader2 } from 'lucide-react';
import { Button } from '@/common/components/ui/Button';
import { useAiSettings, useUpdateAiSettings } from '../hooks/useAdminAiChat';

const schema = z.object({
  chatbox_enabled: z.boolean(),
  system_prompt: z.string().max(4000).optional(),
});

type FormData = z.infer<typeof schema>;

export default function AdminAiSettingsPage() {
  const { data, isLoading } = useAiSettings();
  const update = useUpdateAiSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { chatbox_enabled: true, system_prompt: '' },
  });

  useEffect(() => {
    if (data) {
      reset({
        chatbox_enabled: data.chatbox_enabled,
        system_prompt: data.system_prompt ?? '',
      });
    }
  }, [data, reset]);

  const onSubmit = (values: FormData) =>
    update.mutate({
      chatbox_enabled: values.chatbox_enabled,
      system_prompt: values.system_prompt?.trim() ? values.system_prompt : null,
    });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400 dark:text-slate-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-2">
        <Bot className="h-6 w-6 text-teal-600" />
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          AI Chatbox Settings
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="admin-card space-y-6 p-6">
        <label className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Enable chatbox
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              When off, the floating chatbox is hidden from the storefront.
            </p>
          </div>
          <input
            type="checkbox"
            {...register('chatbox_enabled')}
            className="h-5 w-5 accent-teal-600"
          />
        </label>

        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
            System prompt (optional)
          </label>
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
            Override the built-in assistant prompt. Leave blank to use the default.
          </p>
          <textarea
            rows={8}
            {...register('system_prompt')}
            placeholder="Để trống để dùng prompt mặc định…"
            className="admin-input resize-y font-mono text-xs"
          />
          {errors.system_prompt && (
            <p className="mt-1 text-xs text-rose-600">
              {errors.system_prompt.message}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            disabled={update.isPending || !isDirty}
          >
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
