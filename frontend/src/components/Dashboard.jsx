import { useEffect, useState } from 'react';
import TranscriptFeed from './TranscriptFeed';
import AlertFeed from './AlertFeed';

function formatTime(seconds) {
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.abs(seconds) % 60;
  const sign = seconds < 0 ? '-' : '';
  return `${sign}${m}:${s.toString().padStart(2, '0')}`;
}

export default function Dashboard({
  agenda,
  currentItemIndex,
  transcript,
  agendaCheck,
  timer,
  alerts,
  onNextItem,
  onEnd,
}) {
  const [localElapsed, setLocalElapsed] = useState(0);
  const currentItem = agenda[currentItemIndex];
  const budgetSeconds = (currentItem?.minutes || 5) * 60;

  // Tick the local timer every second for smooth UX
  useEffect(() => {
    if (timer) setLocalElapsed(timer.secondsElapsed);
    const id = setInterval(() => setLocalElapsed(prev => prev + 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const remaining = budgetSeconds - localElapsed;
  const isOvertime = remaining < 0;
  const progress = Math.min((localElapsed / budgetSeconds) * 100, 100);

  const statusColor = agendaCheck?.status === 'ON_TOPIC' ? 'green'
    : agendaCheck?.status === 'DIGRESSING' ? 'red' : 'grey';

  return (
    <div className="dashboard">
      {/* Left column */}
      <div className="panel panel-left">
        {/* Current agenda item */}
        <div className="card current-item-card">
          <div className="card-label">Current Item</div>
          <h2 className="current-item-name">{currentItem?.item || '—'}</h2>

          <div className="timer-display" style={{ color: isOvertime ? '#e53e3e' : 'inherit' }}>
            {isOvertime ? 'Overtime' : 'Remaining'}: {formatTime(remaining)}
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
                background: isOvertime ? '#e53e3e' : progress > 75 ? '#ed8936' : '#48bb78',
              }}
            />
          </div>

          <div className="item-nav">
            <button className="btn-sm" onClick={onNextItem} disabled={currentItemIndex >= agenda.length - 1}>
              Next Item →
            </button>
          </div>
        </div>

        {/* Status indicator */}
        <div className={`card status-card status-card--${statusColor}`}>
          <div className="card-label">Agenda Status</div>
          <div className="status-label">{agendaCheck?.status || 'Waiting...'}</div>
          {agendaCheck?.reason && <div className="status-reason">{agendaCheck.reason}</div>}
          {agendaCheck?.confidence != null && (
            <div className="confidence">Confidence: {agendaCheck.confidence}%</div>
          )}
        </div>

        {/* Agenda list */}
        <div className="card agenda-list-card">
          <div className="card-label">Agenda</div>
          <ol className="agenda-list">
            {agenda.map((item, i) => (
              <li
                key={i}
                className={`agenda-list-item ${i === currentItemIndex ? 'active' : ''} ${i < currentItemIndex ? 'done' : ''}`}
              >
                <span className="agenda-list-item-name">{item.item}</span>
                <span className="agenda-list-item-min">{item.minutes}m</span>
              </li>
            ))}
          </ol>
        </div>

        <button className="btn-danger" onClick={onEnd}>End Meeting</button>
      </div>

      {/* Right column */}
      <div className="panel panel-right">
        <div className="card transcript-card">
          <div className="card-label">Live Transcript</div>
          <TranscriptFeed entries={transcript} />
        </div>

        {alerts.length > 0 && (
          <div className="card alerts-card">
            <div className="card-label">Voice Alerts</div>
            <AlertFeed alerts={alerts} />
          </div>
        )}
      </div>
    </div>
  );
}
