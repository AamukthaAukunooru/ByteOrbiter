export default function DateControls({ date, onChange }) {
  const toInputValue = (d) => d.toISOString().slice(0, 10)

  const shift = (days) => {
    const next = new Date(date)
    next.setDate(next.getDate() + days)
    onChange(next)
  }

  const today = () => onChange(new Date())

  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      <button
        onClick={() => shift(-365)}
        title="1 year back"
        className="px-2 py-1 rounded text-xs bg-white/10 hover:bg-white/20 transition"
      >
        ««
      </button>
      <button
        onClick={() => shift(-30)}
        title="30 days back"
        className="px-2 py-1 rounded text-xs bg-white/10 hover:bg-white/20 transition"
      >
        «
      </button>
      <button
        onClick={() => shift(-1)}
        className="px-2 py-1 rounded text-xs bg-white/10 hover:bg-white/20 transition"
      >
        ‹
      </button>

      <input
        type="date"
        value={toInputValue(date)}
        onChange={(e) => {
          if (e.target.value) onChange(new Date(e.target.value + 'T12:00:00'))
        }}
        className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white cursor-pointer"
        style={{ colorScheme: 'dark' }}
      />

      <button
        onClick={() => shift(1)}
        className="px-2 py-1 rounded text-xs bg-white/10 hover:bg-white/20 transition"
      >
        ›
      </button>
      <button
        onClick={() => shift(30)}
        title="30 days forward"
        className="px-2 py-1 rounded text-xs bg-white/10 hover:bg-white/20 transition"
      >
        »
      </button>
      <button
        onClick={() => shift(365)}
        title="1 year forward"
        className="px-2 py-1 rounded text-xs bg-white/10 hover:bg-white/20 transition"
      >
        »»
      </button>

      <button
        onClick={today}
        className="px-3 py-1 rounded text-xs font-semibold bg-yellow-500/20 border border-yellow-400/40 text-yellow-300 hover:bg-yellow-500/30 transition"
      >
        Today
      </button>
    </div>
  )
}
