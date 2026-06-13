import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { OrderStatusCount } from '../types/dashboard.types';

interface Props {
  data: OrderStatusCount[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  shipping: '#06b6d4',
  delivered: '#10b981',
  completed: '#14b8a6',
  return_requested: '#f97316',
  cancelled: '#f43f5e',
};

const ALL_STATUSES = [
  'pending',
  'confirmed',
  'shipping',
  'delivered',
  'completed',
  'return_requested',
  'cancelled',
] as const;

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipping: 'Shipping',
  delivered: 'Delivered',
  completed: 'Completed',
  return_requested: 'Return Requested',
  cancelled: 'Cancelled',
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-lg bg-slate-900 px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-white">
        {STATUS_LABELS[name] || name}: {value}
      </p>
    </div>
  );
}

export default function OrderStatusChart({ data }: Props) {
  const dataMap = new Map(data.map((d) => [d.status, d.count]));
  const fullData = ALL_STATUSES.map((status) => ({
    status,
    count: dataMap.get(status) ?? 0,
  }));
  const total = fullData.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
      <h2 className="mb-4 font-jakarta text-lg font-bold text-slate-900">
        Orders by Status
      </h2>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={fullData}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              strokeWidth={0}
            >
              {fullData.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={STATUS_COLORS[entry.status] || '#94a3b8'}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {fullData.map((entry) => (
          <div key={entry.status} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[entry.status] || '#94a3b8' }}
            />
            <span className="text-slate-600">
              {STATUS_LABELS[entry.status] || entry.status}
            </span>
            <span className="font-medium text-slate-900">
              {total > 0 ? Math.round((entry.count / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
