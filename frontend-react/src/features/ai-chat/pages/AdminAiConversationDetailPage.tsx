import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, Loader2, User } from 'lucide-react';
import { formatDate, formatPrice } from '@/common/utils/format.util';
import { getPriceRange } from '@/features/product';
import { useAdminAiConversation } from '../hooks/useAdminAiChat';

export default function AdminAiConversationDetailPage() {
  const { id } = useParams();
  const conversationId = Number(id);
  const { data, isLoading } = useAdminAiConversation(conversationId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/admin/ai-conversations"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" /> Back to conversations
      </Link>

      <div className="flex items-center gap-2">
        <Bot className="h-6 w-6 text-teal-600" />
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Conversation #{conversationId}
        </h1>
      </div>

      <div className="admin-card p-4 sm:p-6">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-slate-400 dark:text-slate-500" />
          </div>
        ) : !data || data.messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            No messages in this conversation.
          </p>
        ) : (
          <div className="space-y-5">
            {data.messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div key={m.id} className="flex gap-3">
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                      isUser
                        ? 'bg-slate-100 dark:bg-slate-800'
                        : 'bg-teal-50 dark:bg-teal-500/15'
                    }`}
                  >
                    {isUser ? (
                      <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    ) : (
                      <Bot className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {isUser ? 'Customer' : 'AI Assistant'}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {formatDate(m.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800 dark:text-slate-200">
                      {m.content}
                    </p>
                    {m.products.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {m.products.map((p) => {
                          const range = getPriceRange(p.variants);
                          return (
                            <span
                              key={p.id}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {p.name}
                              {range ? ` · ${formatPrice(range.min)}` : ''}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
