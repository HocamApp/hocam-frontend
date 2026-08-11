"use client";

import {
  Carousel,
  CarouselContent,
  CarouselCounter,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import type { CoachingCarouselSlide } from "@/lib/coachingApi";

/**
 * The educational part of coaching onboarding.
 *
 * Slide content comes from the backend, which derives it from the master
 * spec — the frontend does not author or paraphrase the service scope.
 */
export function OnboardingCarousel({
  slides,
  onLastSlideReached,
}: {
  slides: CoachingCarouselSlide[];
  onLastSlideReached?: () => void;
}) {
  return (
    <Carousel
      label="Koçluk tanıtımı"
      onSlideChange={(index) => {
        if (index === slides.length - 1) onLastSlideReached?.();
      }}
    >
      <CarouselContent>
        {slides.map((slide) => (
          <CarouselItem key={slide.id}>
            <Card className="h-full">
              <CardContent className="space-y-3 pt-6">
                <h3 className="text-lg font-semibold">{slide.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {slide.body}
                </p>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>

      <div className="mt-4 flex items-center justify-between gap-3">
        <CarouselPrevious />
        <CarouselCounter />
        <CarouselNext />
      </div>
    </Carousel>
  );
}
