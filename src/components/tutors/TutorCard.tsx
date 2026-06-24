"use client";

import Link from "next/link";
import { TutorProfile } from "@/types";
import { formatPrice, formatRating } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

function getInitials(name: string, surname: string): string {
  const n = (name || "").trim()[0] || "";
  const s = (surname || "").trim()[0] || "";
  return (n + s).toUpperCase() || "?";
}

function formatYksRank(rank: number): string {
  return rank.toLocaleString("tr-TR");
}

export function TutorCard({ tutor }: { tutor: TutorProfile }) {
  const tytSubjects = tutor.subjects.filter((s) => s.exam_type === "TYT");
  const aytSubjects = tutor.subjects.filter((s) => s.exam_type === "AYT");
  const orderedSubjects = [...tytSubjects, ...aytSubjects];
  const visibleSubjects = orderedSubjects.slice(0, 4);
  const remainingCount = orderedSubjects.length - 4;

  return (
    <Link href={`/tutors/${tutor.id}`} className="block cursor-pointer">
      <Card className="h-full transition-shadow duration-200 hover:shadow-md hover:border-primary/30">
        <CardContent className="p-0">
          {/* Top section */}
          <div className="flex gap-4 p-4">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarImage
                src={tutor.profile_picture || '/images/demo-teacher.jpg'}
                alt={`${tutor.name} ${tutor.surname}`}
              />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                {getInitials(tutor.name, tutor.surname)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold">
                {tutor.name} {tutor.surname}
              </p>
              <p className="text-sm text-muted-foreground">
                {tutor.university} · {tutor.department}
              </p>
              <p className="text-sm text-muted-foreground">
                YKS Sıralaması: {formatYksRank(tutor.yks_rank)}
              </p>
              {tutor.is_verified && (
                <Badge variant="secondary" className="mt-1 text-xs text-green-700 dark:text-green-400">
                  ✓ Onaylı
                </Badge>
              )}
            </div>
          </div>

          {/* Middle section - subjects */}
          <div className="flex flex-wrap gap-1 px-4 pb-3">
            {visibleSubjects.map((sub) => (
              <Badge key={sub.id} variant="outline" className="text-xs">
                {sub.name}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <span className="text-xs text-muted-foreground">+{remainingCount} daha</span>
            )}
          </div>

          {/* Bottom section */}
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div>
              {tutor.total_reviews > 0 ? (
                <>
                  <span className="font-medium">★ {formatRating(tutor.rating)}</span>
                  <span className="ml-1 text-sm text-muted-foreground">
                    ({tutor.total_reviews} değerlendirme)
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Henüz değerlendirme yok</span>
              )}
            </div>
            <div className="text-right">
              <span className="font-medium">{formatPrice(tutor.hourly_price)}</span>
              <span className="ml-1 text-sm text-muted-foreground">/saat</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
