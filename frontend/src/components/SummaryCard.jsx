export default function SummaryCard({ summary, onReset }) {
  const score = summary.efficiencyScore ?? 0;
  const scoreColor = score >= 75 ? '#48bb78' : score >= 50 ? '#ed8936' : '#e53e3e';

  return (
    <div className="summary-page">
      <div className="summary-card">
        <h2>Meeting Complete</h2>

        <div className="score-ring" style={{ borderColor: scoreColor }}>
          <div className="score-value" style={{ color: scoreColor }}>{score}</div>
          <div className="score-label">/ 100</div>
        </div>
        <p className="score-caption">Efficiency Score</p>

        {summary.decisions?.length > 0 && (
          <section>
            <h3>Decisions Made</h3>
            <ul>
              {summary.decisions.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </section>
        )}

        {summary.actionItems?.length > 0 && (
          <section>
            <h3>Action Items</h3>
            <table className="action-table">
              <thead>
                <tr><th>Task</th><th>Owner</th></tr>
              </thead>
              <tbody>
                {summary.actionItems.map((a, i) => (
                  <tr key={i}>
                    <td>{a.item}</td>
                    <td>{a.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {summary.suggestions?.length > 0 && (
          <section>
            <h3>Suggestions for Next Meeting</h3>
            <ol>
              {summary.suggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </section>
        )}

        <button className="btn-primary" onClick={onReset} style={{ marginTop: '2rem' }}>
          Start New Meeting
        </button>
      </div>
    </div>
  );
}
