export default function ScoreButtons({ scale, value, onChange }) {
  return (
    <div className="score-buttons">
      {scale.map((n) => (
        <button
          key={n}
          type="button"
          className={`score-btn ${value === n ? 'selected' : ''}`}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
