/**
 * ContextFeed — displays live context cards fetched by TinyFish
 * when a URL or company/client name is mentioned in the meeting.
 */
export default function ContextFeed({ cards }) {
  if (cards.length === 0) return null;

  return (
    <div className="card context-card-panel">
      <div className="card-label">Live Context (via TinyFish)</div>
      <div className="context-feed">
        {cards.map((card, i) => (
          <div key={i} className="context-item">
            <div className="context-item-header">
              <span className="context-trigger-badge">
                {card.trigger === 'url' ? 'URL' : 'Topic'}
              </span>
              <span className="context-query">{card.query}</span>
              {card.mentionedBy && (
                <span className="context-mentioned-by">mentioned by {card.mentionedBy}</span>
              )}
            </div>

            {/* URL fetch result */}
            {card.trigger === 'url' && (
              <div className="context-result">
                <a href={card.url} target="_blank" rel="noreferrer" className="context-title">
                  {card.title}
                </a>
                <p className="context-snippet">{card.snippet}</p>
              </div>
            )}

            {/* Topic search results */}
            {card.trigger === 'topic' && card.results?.map((r, j) => (
              <div key={j} className="context-result">
                <a href={r.url} target="_blank" rel="noreferrer" className="context-title">
                  {r.title}
                </a>
                <p className="context-snippet">{r.snippet}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
