import { useState } from 'react';

const DEFAULT_AGENDA = [
  { item: 'Project status update', minutes: 10 },
  { item: 'Blockers and risks', minutes: 10 },
  { item: 'Q3 budget review', minutes: 15 },
  { item: 'Action items and owners', minutes: 5 },
];

export default function AgendaSetup({ onStart }) {
  const [meetingUrl, setMeetingUrl] = useState('');
  const [agenda, setAgenda] = useState(DEFAULT_AGENDA);
  const [loading, setLoading] = useState(false);

  function updateItem(index, field, value) {
    setAgenda(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: field === 'minutes' ? Number(value) : value } : item
    ));
  }

  function addItem() {
    setAgenda(prev => [...prev, { item: '', minutes: 5 }]);
  }

  function removeItem(index) {
    setAgenda(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!meetingUrl.trim()) return alert('Please enter a Google Meet URL');
    const validItems = agenda.filter(a => a.item.trim());
    if (validItems.length === 0) return alert('Add at least one agenda item');
    setLoading(true);
    await onStart({ meetingUrl: meetingUrl.trim(), agenda: validItems });
    setLoading(false);
  }

  return (
    <div className="setup-card">
      <h2>Set Up Your Meeting</h2>
      <p className="setup-subtitle">MeetingMind AI will join as a named participant and facilitate the session.</p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Google Meet URL</label>
          <input
            type="url"
            placeholder="https://meet.google.com/abc-defg-hij"
            value={meetingUrl}
            onChange={e => setMeetingUrl(e.target.value)}
            required
          />
        </div>

        <div className="agenda-section">
          <div className="agenda-header">
            <label>Agenda Items</label>
            <button type="button" className="btn-sm" onClick={addItem}>+ Add item</button>
          </div>

          {agenda.map((item, i) => (
            <div key={i} className="agenda-row">
              <span className="agenda-num">{i + 1}.</span>
              <input
                className="agenda-item-input"
                placeholder="Agenda item"
                value={item.item}
                onChange={e => updateItem(i, 'item', e.target.value)}
              />
              <input
                type="number"
                className="agenda-min-input"
                min="1"
                max="60"
                value={item.minutes}
                onChange={e => updateItem(i, 'minutes', e.target.value)}
              />
              <span className="min-label">min</span>
              <button type="button" className="btn-remove" onClick={() => removeItem(i)}>x</button>
            </div>
          ))}
        </div>

        <div className="total-time">
          Total: {agenda.reduce((s, a) => s + (a.minutes || 0), 0)} minutes
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Joining meeting...' : 'Start Meeting'}
        </button>
      </form>
    </div>
  );
}
