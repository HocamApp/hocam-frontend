"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MilestoneNode } from "@/components/learning/MilestoneNode";
import {
  splitPathIntoSections,
  type MilestonePathNode,
} from "@/lib/learning";
import { cn } from "@/lib/utils";

const COLUMN_WIDTH = 320;
const CENTER_X = COLUMN_WIDTH / 2;
const NODE_SPACING = 112;
const NODE_RADIUS = 32;
const ZIGZAG_OFFSETS = [0, 52, 78, 52, 0, -52, -78, -52];

interface MilestonePathProps {
  nodes: MilestonePathNode[];
  /** Preview mode: the package is not in the student's goals yet. */
  isPreview: boolean;
  onActivate?: () => void;
  isActivating?: boolean;
}

function nodeOffset(globalIndex: number) {
  return ZIGZAG_OFFSETS[globalIndex % ZIGZAG_OFFSETS.length];
}

function isNodeCompleted(node: MilestonePathNode) {
  return node.state === "completed" || node.state === "reward_unlocked";
}

function SectionConnectors({
  nodes,
  startIndex,
}: {
  nodes: MilestonePathNode[];
  startIndex: number;
}) {
  if (nodes.length < 2) return null;

  const height = nodes.length * NODE_SPACING;

  return (
    <svg
      className="pointer-events-none absolute inset-x-0 top-0"
      width={COLUMN_WIDTH}
      height={height}
      viewBox={`0 0 ${COLUMN_WIDTH} ${height}`}
      aria-hidden="true"
    >
      {nodes.slice(0, -1).map((node, index) => {
        const nextNode = nodes[index + 1];
        const x1 = CENTER_X + nodeOffset(startIndex + index);
        const y1 = index * NODE_SPACING + NODE_RADIUS;
        const x2 = CENTER_X + nodeOffset(startIndex + index + 1);
        const y2 = (index + 1) * NODE_SPACING + NODE_RADIUS;
        const bendY = (y2 - y1) * 0.55;
        const isDone = isNodeCompleted(node) && isNodeCompleted(nextNode);

        return (
          <path
            key={node.id}
            d={`M ${x1} ${y1} C ${x1} ${y1 + bendY}, ${x2} ${y2 - bendY}, ${x2} ${y2}`}
            fill="none"
            strokeWidth={isDone ? 5 : 4}
            strokeLinecap="round"
            strokeDasharray={isDone ? undefined : "1 11"}
            className={cn(
              isDone ? "stroke-primary/60" : "stroke-muted-foreground/30"
            )}
          />
        );
      })}
    </svg>
  );
}

export function MilestonePath({
  nodes,
  isPreview,
  onActivate,
  isActivating = false,
}: MilestonePathProps) {
  const prefersReducedMotion = useReducedMotion();
  const sections = splitPathIntoSections(nodes);

  let globalIndex = 0;

  return (
    <div className="space-y-2">
      {sections.map((section) => {
        const sectionStartIndex = globalIndex;
        globalIndex += section.nodes.length;

        return (
          <section key={section.label} aria-label={section.label}>
            <div className="mx-auto flex max-w-md items-center gap-4 py-4">
              <span className="h-px flex-1 bg-border" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {section.label}
              </span>
              <span className="h-px flex-1 bg-border" aria-hidden="true" />
            </div>

            <div
              className="relative mx-auto mt-8"
              style={{
                width: COLUMN_WIDTH,
                height: section.nodes.length * NODE_SPACING,
              }}
            >
              <SectionConnectors
                nodes={section.nodes}
                startIndex={sectionStartIndex}
              />

              {section.nodes.map((node, index) => {
                const nodeIndex = sectionStartIndex + index;

                return (
                  <motion.div
                    key={node.id}
                    className="absolute"
                    style={{
                      top: index * NODE_SPACING,
                      left:
                        CENTER_X + nodeOffset(nodeIndex) - NODE_RADIUS,
                    }}
                    initial={
                      prefersReducedMotion
                        ? false
                        : { opacity: 0, scale: 0.6 }
                    }
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: prefersReducedMotion ? 0 : nodeIndex * 0.05,
                    }}
                  >
                    <MilestoneNode
                      node={node}
                      isPreview={isPreview}
                      onActivate={onActivate}
                      isActivating={isActivating}
                    />
                  </motion.div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
