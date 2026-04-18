import { useEffect, useRef } from 'react';

export default function TranscriptFeed({ entries }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  if (entries.length === 0) {
    return <div className="transcript-empty">Waiting for transcript...</div>;
  }

  return (
    <div className="transcript-feed">
      {entries.map((entry, i) => (
        <div key={i} className="transcript-entry">
          <span className="transcript-speaker">{entry.speaker}</span>
          <span className="transcript-text">{entry.text}</span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
