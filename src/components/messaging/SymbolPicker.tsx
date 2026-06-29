"use client";

import { useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Sık kullanılan sohbet emojileri
const EMOJIS = [
  "😀",
  "😄",
  "😊",
  "😍",
  "😎",
  "🤔",
  "😅",
  "😂",
  "🥳",
  "😴",
  "😢",
  "😡",
  "👍",
  "👎",
  "👏",
  "🙏",
  "💪",
  "🤝",
  "🎉",
  "🔥",
  "💯",
  "⭐",
  "❤️",
  "💡",
  "✅",
  "❌",
  "✏️",
  "📚",
  "⏰",
  "🎯",
];

// Eğitim/mesaj için kısa semboller
const SYMBOLS = [
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

interface SymbolPickerProps {
  onSelect: (symbol: string) => void;
  disabled?: boolean;
}

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
          <span className="sr-only">Emoji ve sembol ekle</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto max-w-[16rem] p-2">
        <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">Emoji</p>
        <div className="grid grid-cols-6 gap-1">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handlePick(emoji)}
              className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-accent"
            >
              {emoji}
              <span className="sr-only">{`Emoji ${emoji} ekle`}</span>
            </button>
          ))}
        </div>
        <p className="px-1 pb-1 pt-2 text-xs font-medium text-muted-foreground">
          Semboller
        </p>
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
