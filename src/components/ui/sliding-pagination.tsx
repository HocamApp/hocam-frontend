"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface PaginationProps {
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
  className?: string
  maxVisiblePages?: number // max number of page buttons to show before adding dots
}

export function getVisiblePages(
  totalPages: number,
  currentPage: number,
  maxVisiblePages = 7
): (number | -1)[] {
  if (totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const innerSlots = Math.max(1, maxVisiblePages - 2)
  let start = Math.max(2, currentPage - Math.floor(innerSlots / 2))
  let end = Math.min(totalPages - 1, start + innerSlots - 1)
  start = Math.max(2, end - innerSlots + 1)

  const pages: (number | -1)[] = [1]
  if (start > 2) pages.push(-1)
  for (let page = start; page <= end; page += 1) pages.push(page)
  if (end < totalPages - 1) pages.push(-1)
  pages.push(totalPages)
  return pages
}

export default function SlidingPagination({
  totalPages,
  currentPage,
  onPageChange,
  className,
  maxVisiblePages = 7,
}: PaginationProps) {
  const buttonRefs = React.useRef<(HTMLButtonElement | null)[]>([])
  const [underlineStyle, setUnderlineStyle] = React.useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  })

  // Update underline position whenever current page changes
  React.useEffect(() => {
    const currentBtn = buttonRefs.current[currentPage - 1]
    if (currentBtn) {
      const rect = currentBtn.getBoundingClientRect()
      const parentRect = currentBtn.parentElement!.getBoundingClientRect()
      setUnderlineStyle({
        left: rect.left - parentRect.left,
        width: rect.width,
      })
    }
  }, [currentPage, totalPages])

  const pagesToShow = getVisiblePages(totalPages, currentPage, maxVisiblePages)

  return (
    <div className={cn("relative inline-flex items-center gap-2", className)}>
      {pagesToShow.map((pageNum, i) =>
        pageNum === -1 ? (
          <span key={`dots-${i}`} className="px-2 text-muted-foreground">…</span>
        ) : (
          <Button
            key={pageNum}
            variant="ghost"
            ref={(el) => {
              buttonRefs.current[pageNum - 1] = el
            }}
            onClick={() => onPageChange(pageNum)}
            className={cn(
              "relative min-h-11 min-w-11 px-4 py-2 text-sm",
              pageNum === currentPage ? "font-semibold" : ""
            )}
          >
            {pageNum}
          </Button>
        )
      )}

      {/* Sliding underline */}
      <motion.div
        layout
        initial={false}
        animate={{
          left: underlineStyle.left,
          width: underlineStyle.width,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="absolute bottom-0 h-0.5 bg-primary rounded"
      />
    </div>
  )
}
