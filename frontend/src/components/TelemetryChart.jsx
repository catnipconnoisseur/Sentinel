/**
 * TelemetryChart — Recharts line chart for machine telemetry.
 * Redesigned: cleaner card layout, custom tooltip, metric legend pills.
 */

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const METRICS = [
  { key: 'volt',      name: 'Voltage',   color: '#6366f1' },
  { key: 'rotate',    name: 'Rotation',  color: '#8b5cf6' },
  { key: 'pressure',  name: 'Pressure',  color: '#06b6d4' },
  { key: 'vibration', name: 'Vibration', color: '#f59e0b' },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 14px',
      boxShadow: 'var(--shadow-md)',
      minWidth: 140,
    }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: entry.color, fontWeight: 500 }}>{entry.name}</span>
          <span style={{ fontSize: 11, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            {entry.value?.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

function CustomLegend({ payload }) {
  if (!payload?.length) return null;
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 12 }}>
      {payload.map((entry) => (
        <div key={entry.value} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 24, height: 2, background: entry.color, borderRadius: 1 }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function TelemetryChart({ data, selectedMetric = null }) {
  if (!data || data.length === 0) {
    return (
      <div className="card" style={{
        padding: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 280,
        flexDirection: 'column',
        gap: 10,
      }}>
        <div style={{ fontSize: 20, opacity: 0.4 }}>📡</div>
        <p className="t-caption">No telemetry data available</p>
      </div>
    );
  }

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
    <div className="card" style={{ padding: 20 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <span className="t-card-title">Telemetry · Last 7 Days</span>
        <span className="badge badge-neutral">{data.length} readings</span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
            interval="preserveStartEnd"
            tickCount={5}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
            width={36}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-default)', strokeWidth: 1 }} />
          <Legend content={<CustomLegend />} />
          {metricsToShow.map((metric) => (
            <Line
              key={metric.key}
              type="monotone"
              dataKey={metric.key}
              name={metric.name}
              stroke={metric.color}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
