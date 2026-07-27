"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, TrendingUp } from "lucide-react";
import { trackHomeEvent } from "@/lib/homeAnalytics";
import {
  HOME_TOPIC_COLUMNS,
  HOME_TOPIC_FEATURED,
} from "@/components/home/homeShowcaseContent";
import { Button } from "@/components/ui/button";

/**
 * Long-tail discovery block: one featured highlight beside columns of topic
 * links. The links are real pre-filtered searches; the ordering is editorial.
 *
 * Deliberately stays a text-link block. The featured item is raised onto a
 * card so it outranks the columns, while the counts sit below each link in a
 * smaller, lighter style so they never compete with the link itself.
 */
export function HomeTopicLinks() {
  return (
    <section aria-labelledby="home-topics-title" className="space-y-7">
      <div>
        <h2 id="home-topics-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Konu başlıkları
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          İlgilendiğin başlığı seç; o başlıkta çalışan hocalara doğrudan ulaş.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-12">
        <div className="min-w-0 rounded-2xl border bg-card p-6 shadow-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            Öne çıkan
          </span>
          <p className="mt-4 text-xl font-semibold leading-snug tracking-tight">
            {HOME_TOPIC_FEATURED.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {HOME_TOPIC_FEATURED.description}
          </p>
          <Button asChild className="mt-5 w-full rounded-xl sm:w-auto">
            <Link
              href={HOME_TOPIC_FEATURED.ctaHref}
              onClick={() => trackHomeEvent("home_topic_link_clicked", { topic: "featured" })}
            >
              {HOME_TOPIC_FEATURED.ctaLabel}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="grid min-w-0 gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_TOPIC_COLUMNS.map((column) => (
            <div key={column.id} className="min-w-0">
              <h3 className="border-b pb-2 text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {column.heading}
              </h3>
              <ul className="mt-3.5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label} className="min-w-0">
                    <Link
                      href={link.href}
                      onClick={() =>
                        trackHomeEvent("home_topic_link_clicked", { topic: link.label })
                      }
                      className="group inline-flex max-w-full items-center gap-0.5 text-[15px] font-medium hover:text-primary"
                    >
                      <span className="truncate">{link.label}</span>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
