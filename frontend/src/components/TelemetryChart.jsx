/**
 * TelemetryChart — Recharts line chart for machine telemetry.
 * Shows voltage, rotation, pressure, and vibration over time.
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const METRICS = [
  { key: 'volt', name: 'Voltage', color: '#6366f1' },
  { key: 'rotate', name: 'Rotation', color: '#8b5cf6' },
  { key: 'pressure', name: 'Pressure', color: '#06b6d4' },
  { key: 'vibration', name: 'Vibration', color: '#f59e0b' },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-3 shadow-xl">
      <p className="text-xs text-[var(--text-muted)] mb-2">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: <span className="font-medium">{entry.value?.toFixed(1)}</span>
        </p>
      ))}
    </div>
  );
}

export default function TelemetryChart({ data, selectedMetric = null }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-[250px] text-[var(--text-muted)] text-sm">
        No telemetry data available
      </div>
    );
  }

  // Format timestamps for display
  const chartData = data.map((d) => ({
    ...d,
    time: new Date(d.datetime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
    }),
  }));

  const metricsToShow = selectedMetric
    ? METRICS.filter((m) => m.key === selectedMetric)
    : METRICS;

  return (
    <div className="glass-card p-6" style={{ pointerEvents: 'auto' }}>
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
        Telemetry — Last 7 Days
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            interval="preserveStartEnd"
            tickCount={6}
          />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={40} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }}
          />
          {metricsToShow.map((metric) => (
            <Line
              key={metric.key}
              type="monotone"
              dataKey={metric.key}
              name={metric.name}
              stroke={metric.color}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
