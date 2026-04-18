export default function AlertFeed({ alerts }) {
  return (
    <div className="alert-feed">
      {alerts.map((alert, i) => (
        <div key={i} className={`alert-entry alert-entry--${alert.type}`}>
          <span className="alert-type-badge">{alert.type === 'digression' ? 'Off-topic' : 'Overtime'}</span>
          <span className="alert-text">{alert.text}</span>
        </div>
      ))}
    </div>
  );
}
