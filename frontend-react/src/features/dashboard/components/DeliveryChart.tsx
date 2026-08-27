import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type {
  ShipperDeliveryDataPoint,
  RevenueGranularity,
} from '../types/dashboard.types';
import { useChartTheme } from '../utils/useChartTheme';

interface Props {
  data: ShipperDeliveryDataPoint[];
  granularity?: RevenueGranularity;
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
        {payload[0].value} {payload[0].value === 1 ? 'delivery' : 'deliveries'}
      </p>
    </div>
  );
}

export default function DeliveryChart({ data, granularity = 'day' }: Props) {
  const formatDateLabel = makeDateLabelFormatter(granularity);
  const chart = useChartTheme();

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
      <h2 className="mb-4 font-jakarta text-lg font-bold text-slate-900 dark:text-slate-100">
        Deliveries
      </h2>
      <div className="h-72">
        {data.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <p className="text-sm">No delivery data in this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateLabel}
                tick={{ fontSize: 12, fill: chart.axis }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: chart.axis }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                content={<CustomTooltip labelFormatter={formatDateLabel} />}
              />
              <Bar
                dataKey="count"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
