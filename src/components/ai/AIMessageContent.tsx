import { Fragment } from "react";

/**
 * Lightweight, dependency-free renderer for AI assistant messages.
 *
 * The Gemini system prompt (apps/ai_assistant/services/gemini_client.py)
 * explicitly asks the model to answer directly and "use at most four short
 * bullet points when a list helps readability," and direct_answers.py builds
 * numbered tutor lists as raw "1. Name\n   - Subject\n   - University" text.
 * Rendering that through a single `whitespace-pre-wrap` <p> showed the raw
 * "1."/"-"/"**" characters instead of an actual list/emphasis, which is what
 * the QA report ("ai chatbot formatı goze guzel gelsin") was pointing at.
 *
 * This intentionally does NOT pull in a markdown library — the model's
 * output is constrained to a few predictable patterns (numbered lines,
 * "- " bullets, "**bold**"), so a small line-based parser covers it without
 * a new dependency or any risk of executing arbitrary HTML.
 */

type Segment = { text: string; bold: boolean };

function splitBold(line: string): Segment[] {
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return { text: part.slice(2, -2), bold: true };
    }
    return { text: part, bold: false };
  });
}

function renderInline(line: string, keyPrefix: string) {
  return splitBold(line).map((segment, index) =>
    segment.bold ? (
      <strong key={`${keyPrefix}-${index}`} className="font-semibold">
        {segment.text}
      </strong>
    ) : (
      <Fragment key={`${keyPrefix}-${index}`}>{segment.text}</Fragment>
    )
  );
}

const NUMBERED_RE = /^(\d+)\.\s+(.*)$/;
const BULLET_RE = /^[-*]\s+(.*)$/;
const SUB_BULLET_RE = /^\s{2,}[-*]\s+(.*)$/;

type Block =
  | { type: "paragraph"; lines: string[] }
  | { type: "ordered"; items: string[] }
  | { type: "unordered"; items: string[] };

function parseBlocks(content: string): Block[] {
  const lines = content.split("\n");
  const blocks: Block[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.trim() === "") continue;

    const numbered = line.match(NUMBERED_RE);
    const subBullet = line.match(SUB_BULLET_RE);
    const bullet = !subBullet ? line.match(BULLET_RE) : null;

    if (numbered) {
      const last = blocks[blocks.length - 1];
      const item = numbered[2];
      if (last?.type === "ordered") last.items.push(item);
      else blocks.push({ type: "ordered", items: [item] });
      continue;
    }

    if (bullet || subBullet) {
      const item = (bullet ?? subBullet)![1];
      const last = blocks[blocks.length - 1];
      // Sub-bullets (backend's "   - Subject" lines under a numbered tutor
      // entry) nest under the most recent list item as a continuation line
      // rather than their own list, matching the source data's intent.
      if (subBullet && last && (last.type === "ordered" || last.type === "unordered")) {
        last.items[last.items.length - 1] += ` — ${item}`;
        continue;
      }
      if (last?.type === "unordered") last.items.push(item);
      else blocks.push({ type: "unordered", items: [item] });
      continue;
    }

    const last = blocks[blocks.length - 1];
    if (last?.type === "paragraph") last.lines.push(line);
    else blocks.push({ type: "paragraph", lines: [line] });
  }

  return blocks;
}

export function AIMessageContent({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-2 text-sm leading-6">
      {blocks.map((block, blockIndex) => {
        const key = `block-${blockIndex}`;
        if (block.type === "ordered") {
          return (
            <ol key={key} className="list-decimal space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>
                  {renderInline(item, `${key}-${itemIndex}`)}
                </li>
              ))}
            </ol>
          );
        }
        if (block.type === "unordered") {
          return (
            <ul key={key} className="list-disc space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>
                  {renderInline(item, `${key}-${itemIndex}`)}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={key} className="whitespace-pre-wrap">
            {block.lines.map((line, lineIndex) => (
              <Fragment key={`${key}-${lineIndex}`}>
                {lineIndex > 0 && <br />}
                {renderInline(line, `${key}-${lineIndex}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
