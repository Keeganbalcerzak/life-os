export default function DueFilter({ value = 'all', onChange }) {
  const options = [
    { key: 'all', label: 'All' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'none', label: 'No Due' },
  ];

  return (
    <div className="due-filter">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          className={`due-chip ${value === opt.key ? 'active' : ''}`}
          onClick={() => onChange && onChange(opt.key)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

