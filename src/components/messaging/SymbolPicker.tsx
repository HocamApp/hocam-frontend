"use client";

import { useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SymbolPickerProps {
  onSelect: (symbol: string) => void;
  disabled?: boolean;
}

// Eğitim/mesaj için kısa semboller
const SYMBOLS = [
  "👍",
  "✅",
  "❌",
  "?",
  "!",
  "➕",
  "➖",
  "✖️",
  "÷",
  "=",
  "≠",
  "√",
  "π",
  "∑",
  "→",
  "←",
  "↑",
  "↓",
];

export function SymbolPicker({ onSelect, disabled = false }: SymbolPickerProps) {
  const [open, setOpen] = useState(false);

  const handlePick = (symbol: string) => {
    onSelect(symbol);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="h-10 w-10 shrink-0"
        >
          <Smile className="h-4 w-4" />
          <span className="sr-only">Sembol ekle</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-2">
        <div className="grid grid-cols-6 gap-1">
          {SYMBOLS.map((symbol) => (
            <button
              key={symbol}
              type="button"
              onClick={() => handlePick(symbol)}
              className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-accent"
            >
              {symbol}
              <span className="sr-only">{`Sembol ${symbol} ekle`}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
