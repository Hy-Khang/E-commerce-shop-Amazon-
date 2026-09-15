import { Link } from 'react-router-dom';
import { Bot, Loader2, MessageSquare } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { Pagination } from '@/common/components/data/Pagination';
import { formatDate } from '@/common/utils/format.util';
import { useAdminAiConversations } from '../hooks/useAdminAiChat';

export default function AdminAiConversationListPage() {
  const { params, setPage } = usePagination({ limit: 20 });
  const { data, isLoading } = useAdminAiConversations(params);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bot className="h-6 w-6 text-teal-600" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            AI Conversations
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Review chatbot conversations with customers and guests
          </p>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-slate-400 dark:text-slate-500" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <MessageSquare className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              No conversations yet
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="admin-table-header">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Last activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((c) => (
                <tr
                  key={c.id}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    #{c.id}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/ai-conversations/${c.id}`}
                      className="font-medium text-teal-700 hover:underline dark:text-teal-400"
                    >
                      {c.title || 'Untitled conversation'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {c.user_id ? `User #${c.user_id}` : 'Guest'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {formatDate(c.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
