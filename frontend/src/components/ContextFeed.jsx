/**
 * ContextFeed — displays live context cards fetched by TinyFish
 * when a speaker says "I don't know" / "I'm not sure".
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
              <span className="context-trigger-badge">Searching</span>
              <span className="context-query">"{card.query}"</span>
              {card.mentionedBy && (
                <span className="context-mentioned-by">{card.mentionedBy} wasn't sure</span>
              )}
            </div>

            {card.results?.map((r, j) => (
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
