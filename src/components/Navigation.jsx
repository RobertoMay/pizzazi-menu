import { useEffect, useRef } from 'react';

export default function Navigation({ tabs, activeTab, onTabClick }) {
  const containerRef = useRef(null);
  const buttonRefs = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    const button = buttonRefs.current[activeTab];
    if (!container || !button) return;
    const cr = container.getBoundingClientRect();
    const br = button.getBoundingClientRect();
    if (br.left < cr.left || br.right > cr.right) {
      button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  return (
    <div ref={containerRef} className="flex gap-2 px-4 py-3 overflow-x-auto hide-scrollbar">
      {tabs.map((label, i) => (
        <button
          key={i}
          ref={(el) => { buttonRefs.current[i] = el; }}
          onClick={() => onTabClick(i)}
          className="flex-shrink-0 px-4 py-1.5 text-base font-semibold whitespace-nowrap rounded-full transition-all"
          style={{
            background: activeTab === i ? '#F84331' : '#0B121A',
            color: activeTab === i ? '#fff' : '#9ca3af',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
