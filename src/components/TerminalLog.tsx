// src/components/TerminalLog.tsx
// Settlement event log — clean data feed style

import type { SettlementLog } from '../hooks/useDeltaEngine';

type Props = {
  logs: SettlementLog[];
};

export const TerminalLog = ({ logs }: Props) => {
  if (!logs || logs.length === 0) return null;

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div className="settlement-log">
      {logs.map((e, i) => (
        <div key={i} className={`log-entry ${e.type}`}>
          <span className="log-ts">{formatTime(e.ts)}</span>
          <span className="log-msg">{e.msg}</span>
        </div>
      ))}
    </div>
  );
};
