import { useState, useEffect, useRef } from 'react';
import AgendaSetup from './components/AgendaSetup';
import Dashboard from './components/Dashboard';
import SummaryCard from './components/SummaryCard';
import './App.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function App() {
  const [phase, setPhase] = useState('setup'); // setup | live | ended
  const [agenda, setAgenda] = useState([]);
  const [transcript, setTranscript] = useState([]);
  const [agendaCheck, setAgendaCheck] = useState(null);
  const [timer, setTimer] = useState(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [summary, setSummary] = useState(null);
  const [botStatus, setBotStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [contextCards, setContextCards] = useState([]);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    const es = new EventSource(`${API}/webhook/events`);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      const { type, data } = JSON.parse(e.data);
      switch (type) {
        case 'init':
          if (data.status === 'live') setPhase('live');
          if (data.agenda?.length) setAgenda(data.agenda);
          break;
        case 'meeting_started':
          setAgenda(data.agenda);
          setPhase('live');
          break;
        case 'transcript':
          setTranscript(prev => [...prev.slice(-200), data]);
          break;
        case 'agenda_check':
          setAgendaCheck(data);
          break;
        case 'timer_update':
          setTimer(data);
          setCurrentItemIndex(data.currentItemIndex);
          break;
        case 'voice_alert':
          setAlerts(prev => [data, ...prev].slice(0, 10));
          break;
        case 'item_advanced':
          setCurrentItemIndex(data.index);
          break;
        case 'meeting_summary':
          setSummary(data);
          setPhase('ended');
          break;
        case 'context_card':
          setContextCards(prev => [data, ...prev].slice(0, 20));
          break;
        case 'bot_status':
          setBotStatus(data.status);
          break;
        default:
          break;
      }
    };

    es.onerror = () => console.warn('SSE reconnecting...');
    return () => es.close();
  }, []);

  async function handleStart({ meetingUrl, agenda: newAgenda }) {
    const res = await fetch(`${API}/api/meeting/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingUrl, agenda: newAgenda }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      alert(`Failed to start meeting: ${error}`);
      return;
    }
    setAgenda(newAgenda);
    setCurrentItemIndex(0);
    setPhase('live');
  }

  async function handleNextItem() {
    await fetch(`${API}/api/meeting/next-item`, { method: 'POST' });
  }

  async function handleEnd() {
    const res = await fetch(`${API}/api/meeting/end`, { method: 'POST' });
    if (res.ok) {
      const { summary: s } = await res.json();
      setSummary(s);
      setPhase('ended');
    }
  }

  function handleReset() {
    setPhase('setup');
    setSummary(null);
    setTranscript([]);
    setAlerts([]);
    setContextCards([]);
    setAgendaCheck(null);
    setTimer(null);
    setBotStatus(null);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-icon">🎙</span>
          <h1>MeetingMind AI</h1>
        </div>
        {botStatus && (
          <span className={`bot-badge bot-badge--${botStatus}`}>
            Bot: {botStatus}
          </span>
        )}
      </header>

      <main className="app-main">
        {phase === 'setup' && <AgendaSetup onStart={handleStart} />}
        {phase === 'live' && (
          <Dashboard
            agenda={agenda}
            currentItemIndex={currentItemIndex}
            transcript={transcript}
            agendaCheck={agendaCheck}
            timer={timer}
            alerts={alerts}
            contextCards={contextCards}
            onNextItem={handleNextItem}
            onEnd={handleEnd}
          />
        )}
        {phase === 'ended' && summary && (
          <SummaryCard summary={summary} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}
