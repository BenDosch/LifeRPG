import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import TimeKeeper, { TimeOutput } from 'react-timekeeper';
import { useTheme } from '../../theme/ThemeContext';

interface TimeInputProps {
  value: string | null; // HH:MM or null
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
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  // Recalculate position whenever the clock opens
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const CLOCK_W = 268;
      const CLOCK_H = 310;
      const GAP = 8;

      // Horizontal: align left with trigger, but clamp to viewport
      const rawLeft = rect.left + window.scrollX;
      const maxLeft = window.innerWidth - CLOCK_W - GAP;
      const left = Math.max(GAP, Math.min(rawLeft, maxLeft));

      // Vertical: prefer below, flip above if not enough room
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow >= CLOCK_H + GAP
        ? rect.bottom + window.scrollY + GAP
        : rect.top + window.scrollY - CLOCK_H - GAP;

      setPos({ top, left });
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current && !triggerRef.current.contains(target)) {
        // Don't close if clicking inside the portal clock
        const portal = document.getElementById('timepicker-portal');
        if (!portal || !portal.contains(target)) setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const handleDone = (t: TimeOutput) => {
    onChange(t.formatted24);
    setOpen(false);
  };

  const clock = open ? ReactDOM.createPortal(
    <div
      id="timepicker-portal"
      style={{
        position: 'absolute',
        top: pos.top,
        left: pos.left,
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
    </div>,
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
