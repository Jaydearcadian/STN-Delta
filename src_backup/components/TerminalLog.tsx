// src/components/TerminalLog.tsx
// Streaming settlement log panel — shows real-time Omniston activity

import { useEffect, useRef } from 'react';
import type { SettlementLog } from '../hooks/useDeltaEngine';

type Props = {
  logs: SettlementLog[];
};

const LOG_ICONS: Record<SettlementLog['type'], string> = {
  info: '›',
  success: '✓',
  warn: '⚠',
};

const LOG_COLORS: Record<SettlementLog['type'], string> = {
  info: 'var(--color-slate-500)',
  success: 'var(--color-emerald)',
  warn: 'var(--color-amber)',
};

export const TerminalLog = ({ logs }: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div style={{
      background: 'var(--color-bg)',
      border: '1px solid var(--color-border)',
      borderRadius: '10px',
      padding: '12px',
      maxHeight: '180px',
      overflowY: 'auto',
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
    }}>
      {logs.length === 0 ? (
        <div style={{ color: 'var(--color-slate-600)' }}>
          {'>'} Waiting for events<span className="animate-blink">_</span>
        </div>
      ) : (
        logs.map((entry, i) => (
          <div
            key={i}
            className="animate-stream-in"
            style={{
              color: LOG_COLORS[entry.type],
              marginBottom: '3px',
              animationDelay: `${i * 0.02}s`,
              display: 'flex',
              gap: '6px',
            }}
          >
            <span style={{ opacity: 0.6, flexShrink: 0 }}>
              {LOG_ICONS[entry.type]}
            </span>
            <span style={{ color: entry.type === 'info' ? 'var(--color-slate-400)' : LOG_COLORS[entry.type] }}>
              {entry.msg}
            </span>
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
};
