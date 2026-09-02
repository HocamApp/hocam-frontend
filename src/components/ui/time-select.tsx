"use client";

import { ResponsiveSelect } from "@/components/ui/responsive-select";

// Matches the 30-minute slot grid BookingModal.tsx's getSlotsForDay already
// uses for booking-time selection, for consistency across the app.
function generateTimeOptions(startHour = 6, endHour = 23, stepMinutes = 30): string[] {
  const options: string[] = [];
  for (let m = startHour * 60; m <= endHour * 60 + 30; m += stepMinutes) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    options.push(`${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  id?: string;
}

export function TimeSelect({
  value,
  onChange,
  disabled,
  className,
  placeholder = "Saat seç",
  id,
}: TimeSelectProps) {
  return (
    <ResponsiveSelect
      id={id}
      label="Saat"
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      options={TIME_OPTIONS.map((time) => ({ value: time, label: time }))}
    />
  );
}
