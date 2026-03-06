import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import TimeKeeper, { TimeOutput } from 'react-timekeeper';
import { useTheme } from '../../theme/ThemeContext';

interface TimeInputProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

function formatDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const meridiem = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${meridiem}`;
}

function to12hInput(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const meridiem = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')}${meridiem}`;
}

export function TimeInput({ value, onChange }: TimeInputProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  // Close on outside click (backdrop handles this, but keep for safety)
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      const portal = document.getElementById('timepicker-portal');
      if (portal && !portal.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const handleDone = (t: TimeOutput) => {
    onChange(t.formatted24);
    setOpen(false);
  };

  const clock = open ? ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: 'rgba(0,0,0,0.5)',
        }}
      />
      {/* Centered picker */}
      <div
        id="timepicker-portal"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <TimeKeeper
          time={value ? to12hInput(value) : '12:00pm'}
          onChange={(t: TimeOutput) => onChange(t.formatted24)}
          onDoneClick={handleDone}
          switchToMinuteOnHourSelect
        />
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      <div ref={triggerRef} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: theme.bgPage,
            border: `1px solid ${open ? '#a855f7' : theme.borderDefault}`,
            borderRadius: 8,
            padding: '10px 12px',
            color: value ? theme.textPrimary : theme.textDisabled,
            fontSize: 14,
            fontWeight: value ? 600 : 400,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <span>🕐</span>
          {value ? formatDisplay(value) : 'Set time'}
          <span style={{ color: theme.textDisabled, fontSize: 11 }}>{open ? '▲' : '▼'}</span>
        </button>

        {value && (
          <button
            onClick={() => { onChange(null); setOpen(false); }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: theme.textDisabled,
              fontSize: 20,
              padding: '2px 6px',
              lineHeight: 1,
            }}
            title="Clear"
          >
            ×
          </button>
        )}
      </div>

      {clock}
    </>
  );
}
