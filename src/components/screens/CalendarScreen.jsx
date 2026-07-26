import React, { useState, useMemo, useEffect } from 'react';
import { buildWeek, EVENT_TYPE_META } from '../../utils/calendarGrid';

export default function CalendarScreen({ events, onOpenEvent, onCreateEvent }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null); // dateKey or null (whole week)

  // Navigating to a different week should naturally return to the
  // "whole week" view - otherwise the header keeps saying "That Day"
  // while filtering against a date that isn't even visible in the
  // newly-displayed week anymore, with no day cell shown as selected.
  useEffect(() => {
    setSelectedDay(null);
  }, [weekOffset]);

  const { days, label } = useMemo(() => buildWeek(new Date(), weekOffset), [weekOffset]);

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((evt) => {
      if (!map[evt.date]) map[evt.date] = [];
      map[evt.date].push(evt);
    });
    return map;
  }, [events]);

  const weekDateKeys = days.map((d) => d.dateKey);
  const visibleEvents = useMemo(() => {
    const keys = selectedDay ? [selectedDay] : weekDateKeys;
    return keys
      .flatMap((k) => eventsByDate[k] || [])
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedDay, weekDateKeys, eventsByDate]);

  function pickDay(dateKey) {
    setSelectedDay((prev) => (prev === dateKey ? null : dateKey));
  }

  const selectedDayInfo = selectedDay ? days.find((d) => d.dateKey === selectedDay) : null;

  return (
    <div className="screen active">
      <div className="screen-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="wave-text" style={{ '--wave-delay': '0.2s' }}>Calendar</span>
        <button className="mm-btn" data-tutorial="add-event" style={{ fontSize: 12, padding: '6px 12px' }} onClick={onCreateEvent}>
          + Event
        </button>
      </div>

      <div className="cal-header-row">
        <button className="cal-nav-btn" onClick={() => setWeekOffset((w) => w - 1)}>‹</button>
        <div className="cal-month-label">{label}</div>
        <button className="cal-nav-btn" onClick={() => setWeekOffset((w) => w + 1)}>›</button>
      </div>

      <div className="week-strip">
        {days.map((d) => {
          const hasEvent = !!eventsByDate[d.dateKey];
          const selected = selectedDay === d.dateKey;
          return (
            <div
              key={d.dateKey}
              className={`week-day${d.isToday ? ' today' : ''}${selected ? ' selected' : ''}`}
              onClick={() => pickDay(d.dateKey)}
            >
              <div className="week-day-letter">{d.dow}</div>
              <div className="week-day-num">{d.dayNum}</div>
              {hasEvent && <div className="week-day-dot" />}
            </div>
          );
        })}
      </div>

      <div className="section-header">
        <h3>{selectedDayInfo ? `${selectedDayInfo.monthAbbr} ${selectedDayInfo.dayNum}` : 'This Week'}</h3>
        {selectedDay && (
          <button className="mm-btn" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => setSelectedDay(null)}>
            Show full week
          </button>
        )}
      </div>

      {visibleEvents.length === 0 ? (
        <div className="cal-empty-state">
          <div className="e-icon">📅</div>
          <p>Nothing here yet — tap + Event to add a class item.</p>
        </div>
      ) : (
        visibleEvents.map((evt) => {
          const meta = EVENT_TYPE_META[evt.type] || EVENT_TYPE_META.other;
          return (
            <div
              className="event-row"
              key={evt.id}
              onClick={() => onOpenEvent(evt)}
              style={{ borderLeft: `3px solid ${meta.color}` }}
            >
              <div className="event-type-chip" style={{ background: meta.color + '1F', color: meta.color, border: `1px solid ${meta.color}44` }}>
                {meta.emoji}
              </div>
              <div className="event-info">
                <h5>{evt.subject}</h5>
                <p style={{ color: meta.color }}>{meta.label}{evt.title ? <span style={{ color: 'var(--text-secondary)' }}> · {evt.title}</span> : ''}</p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
