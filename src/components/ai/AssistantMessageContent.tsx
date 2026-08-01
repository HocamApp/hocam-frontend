import { createElement, type HTMLAttributes } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

type AssistantMessageContentProps = {
  content?: string | null;
  className?: string;
  headingBaseLevel?: 2 | 3;
};

const EMPTY_RESPONSE = "Bu yanıt görüntülenemedi. Lütfen yeniden dene.";

function isExternalLink(href?: string) {
  return Boolean(href && /^(?:https?:)?\/\//i.test(href));
}

export function AssistantMessageContent({
  content,
  className,
  headingBaseLevel = 2,
}: AssistantMessageContentProps) {
  const text = content?.trim();

  if (!text) {
    return (
      <p role="note" className="text-[15px] leading-6 text-muted-foreground">
        {EMPTY_RESPONSE}
      </p>
    );
  }

  const heading = (markdownLevel: 1 | 2 | 3) => {
    const semanticLevel = Math.min(
      6,
      headingBaseLevel + (markdownLevel === 3 ? 1 : 0)
    );

    return function AssistantHeading({
      node: _node,
      className: headingClassName,
      ...props
    }: HTMLAttributes<HTMLHeadingElement> & { node?: unknown }) {
      return createElement(`h${semanticLevel}`, {
        ...props,
        className: cn(
          markdownLevel === 3
            ? "mb-1.5 mt-4 text-[15px] font-semibold leading-6"
            : "mb-2 mt-5 text-[17px] font-semibold leading-6 first:mt-0 sm:text-lg",
          "text-foreground [text-wrap:pretty]",
          headingClassName
        ),
      });
    };
  };

  const components: Components = {
    h1: heading(1),
    h2: heading(2),
    h3: heading(3),
    p: ({ node: _node, className: paragraphClassName, ...props }) => (
      <p
        {...props}
        className={cn(
          "mb-3 whitespace-pre-wrap [overflow-wrap:anywhere] last:mb-0 [text-wrap:pretty]",
          paragraphClassName
        )}
      />
    ),
    ul: ({ node: _node, className: listClassName, ...props }) => (
      <ul
        {...props}
        className={cn(
          "mb-3 ml-1 list-outside list-disc space-y-1.5 pl-5 marker:text-muted-foreground last:mb-0 [&_ul]:mb-0 [&_ul]:mt-1.5 [&_ul]:list-[circle]",
          listClassName
        )}
      />
    ),
    ol: ({ node: _node, className: listClassName, ...props }) => (
      <ol
        {...props}
        className={cn(
          "mb-3 ml-1 list-outside list-decimal space-y-1.5 pl-5 marker:font-medium marker:text-muted-foreground last:mb-0 [&_ol]:mb-0 [&_ol]:mt-1.5",
          listClassName
        )}
      />
    ),
    li: ({ node: _node, className: itemClassName, ...props }) => (
      <li
        {...props}
        className={cn(
          "pl-0.5 [overflow-wrap:anywhere] [&>p]:mb-1 [&>p]:inline",
          itemClassName
        )}
      />
    ),
    strong: ({ node: _node, className: strongClassName, ...props }) => (
      <strong
        {...props}
        className={cn("font-semibold text-foreground", strongClassName)}
      />
    ),
    em: ({ node: _node, className: emphasisClassName, ...props }) => (
      <em {...props} className={cn("italic", emphasisClassName)} />
    ),
    a: ({ node: _node, className: linkClassName, href, ...props }) => {
      const external = isExternalLink(href);
      return (
        <a
          {...props}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className={cn(
            "font-medium text-primary underline decoration-primary/40 underline-offset-4 [overflow-wrap:anywhere] hover:decoration-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            linkClassName
          )}
        />
      );
    },
    blockquote: ({ node: _node, className: quoteClassName, ...props }) => (
      <blockquote
        {...props}
        className={cn(
          "my-3 border-l-2 border-primary/40 bg-muted/50 px-3 py-2 text-muted-foreground [&>p]:mb-0",
          quoteClassName
        )}
      />
    ),
    code: ({ node: _node, className: codeClassName, children, ...props }) => {
      const isBlock = Boolean(codeClassName?.startsWith("language-")) ||
        String(children).includes("\n");

      return (
        <code
          {...props}
          className={cn(
            isBlock
              ? "font-mono text-[13px] leading-5 text-foreground"
              : "rounded bg-muted px-1 py-0.5 font-mono text-[0.875em] text-foreground",
            codeClassName
          )}
        >
          {children}
        </code>
      );
    },
    pre: ({ node: _node, className: preClassName, ...props }) => (
      <pre
        {...props}
        tabIndex={0}
        className={cn(
          "my-3 max-w-full overflow-x-auto rounded-md border border-border bg-muted/50 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          preClassName
        )}
      />
    ),
    table: ({ node: _node, className: tableClassName, ...props }) => (
      <div
        role="region"
        aria-label="Yanıt tablosu"
        tabIndex={0}
        className="my-3 max-w-full overflow-x-auto rounded-md border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <table
          {...props}
          className={cn("w-full min-w-max border-collapse text-left text-sm", tableClassName)}
        />
      </div>
    ),
    thead: ({ node: _node, className: headClassName, ...props }) => (
      <thead {...props} className={cn("bg-muted/70", headClassName)} />
    ),
    th: ({ node: _node, className: cellClassName, ...props }) => (
      <th
        {...props}
        className={cn(
          "border-b border-border px-3 py-2 font-semibold text-foreground",
          cellClassName
        )}
      />
    ),
    td: ({ node: _node, className: cellClassName, ...props }) => (
      <td
        {...props}
        className={cn(
          "border-b border-border/70 px-3 py-2 align-top last:border-r-0",
          cellClassName
        )}
      />
    ),
    hr: ({ node: _node, className: ruleClassName, ...props }) => (
      <hr {...props} className={cn("my-5 border-border", ruleClassName)} />
    ),
  };

  return (
    <div
      className={cn(
        "min-w-0 max-w-[72ch] text-left text-[15px] font-normal leading-[1.65] text-foreground sm:text-[15.5px]",
        "[overflow-wrap:anywhere] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
