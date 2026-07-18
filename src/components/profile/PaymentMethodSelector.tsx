"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";

import { useIsMobile } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

export type PaymentMethod = {
  id: string | number;
  icon: React.ReactNode;
  label: string;
  description: string;
};

interface PaymentMethodSelectorProps {
  title: string;
  actionText: string;
  methods: PaymentMethod[];
  defaultSelectedId?: string | number;
  onActionClick?: () => void;
  onSelectionChange?: (id: string | number) => void;
  className?: string;
}

export function PaymentMethodSelector({
  title,
  actionText,
  methods,
  defaultSelectedId,
  onActionClick,
  onSelectionChange,
  className,
}: PaymentMethodSelectorProps) {
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobile() === true;
  const [selectedId, setSelectedId] = React.useState<string | number | null>(
    defaultSelectedId ?? (methods.length > 0 ? methods[0].id : null)
  );

  React.useEffect(() => {
    const nextSelectedId = defaultSelectedId ?? (methods.length > 0 ? methods[0].id : null);
    setSelectedId((current) =>
      methods.some((method) => method.id === current) ? current : nextSelectedId
    );
  }, [defaultSelectedId, methods]);

  const handleSelect = (id: string | number) => {
    setSelectedId(id);
    onSelectionChange?.(id);
  };

  // Mobile: tighter stagger + shorter travel so the list settles fast on
  // low-power devices. Desktop values unchanged.
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: isMobile ? 0.05 : 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: isMobile ? 8 : 16 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div
      className={cn(
        "w-full max-w-md rounded-xl border bg-card p-5 text-card-foreground shadow-sm",
        className
      )}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold leading-none tracking-tight">
          {title}
        </h3>
        <button
          type="button"
          onClick={onActionClick}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          {actionText}
        </button>
      </div>

      <motion.div
        className="space-y-3"
        variants={reduceMotion ? undefined : containerVariants}
        initial={reduceMotion ? false : "hidden"}
        animate={reduceMotion ? undefined : "visible"}
        role="radiogroup"
      >
        {methods.map((method) => {
          const isSelected = selectedId === method.id;

          return (
            <motion.div
              key={method.id}
              variants={reduceMotion ? undefined : itemVariants}
              onClick={() => handleSelect(method.id)}
              onKeyDown={(event) => {
                if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                  handleSelect(method.id);
                }
              }}
              className={cn(
                "flex cursor-pointer items-center rounded-lg border p-4 transition-all duration-300 hover:bg-muted/50 active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected
                  ? "border-primary shadow-[0_0_0_2px_hsl(var(--primary))]"
                  : "border-border"
              )}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                {method.icon}
              </div>
              <div className="ml-4 min-w-0 flex-1">
                <p className="font-medium text-card-foreground">{method.label}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {method.description}
                </p>
              </div>
              <div
                className={cn(
                  "ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                  isSelected ? "border-primary" : "border-border"
                )}
              >
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={reduceMotion ? false : { scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={reduceMotion ? undefined : { scale: 0 }}
                      className="h-3 w-3 rounded-full bg-primary"
                    />
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
