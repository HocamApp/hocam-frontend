"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {TIME_OPTIONS.map((t) => (
          <SelectItem key={t} value={t}>
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
