/** Segmented control. options: [{value,label}] */
export default function Segmented({ options, value, onChange, size = 'sm', className = '' }) {
  return (
    <div className={`segmented ${className}`} role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} data-active={value === o.value} onClick={() => onChange(o.value)} className={size === 'xs' ? '!px-2 !py-1 !text-[11px]' : ''}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
