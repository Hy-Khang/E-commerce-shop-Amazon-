import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type {
  RevenueDataPoint,
  RevenueGranularity,
} from '../types/dashboard.types';

interface Props {
  data: RevenueDataPoint[];
  granularity?: RevenueGranularity;
}

function formatVND(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function makeDateLabelFormatter(granularity: RevenueGranularity) {
  return (dateStr: string): string => {
    const d = new Date(dateStr + 'T00:00:00');
    return granularity === 'month'
      ? d.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })
      : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };
}

function CustomTooltip({
  active,
  payload,
  label,
  labelFormatter,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  labelFormatter: (dateStr: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-slate-900 px-3 py-2 text-sm shadow-lg">
      <p className="text-slate-400">{label ? labelFormatter(label) : ''}</p>
      <p className="font-semibold text-white">
        {new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
          maximumFractionDigits: 0,
        }).format(payload[0].value)}
      </p>
    </div>
  );
}

export default function RevenueChart({ data, granularity = 'day' }: Props) {
  const formatDateLabel = makeDateLabelFormatter(granularity);

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
      <h2 className="mb-4 font-jakarta text-lg font-bold text-slate-900">
        Collected Revenue Trend
      </h2>
      <div className="h-72">
        {data.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-400">
            <p className="text-sm">No revenue data in this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateLabel}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatVND}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip
                content={<CustomTooltip labelFormatter={formatDateLabel} />}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
