import "@/test/setupDom";
import assert from "node:assert/strict";
import { afterEach, before, test, mock } from "node:test";
import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { istanbulCalendarToday } from "@/lib/availability";
import { formatDateLocal } from "@/lib/utils";
import type { Booking } from "@/types";
mock.module("@/components/tutors/DayAvailabilityDialog", {namedExports:{DayAvailabilityDialog:() => null}});
mock.module("@/components/ui/calendar", {namedExports:{Calendar:() => <div>Takvim</div>}});
let AvailabilityCalendar: typeof import("./AvailabilityCalendar").AvailabilityCalendar;
before(async () => {AvailabilityCalendar = (await import("./AvailabilityCalendar")).AvailabilityCalendar;});
afterEach(() => act(() => cleanup()));
test("booking wall-clock day and time do not shift in a Tokyo browser", () => {
  const original = process.env.TZ;
  try {
    process.env.TZ="Asia/Tokyo";
    const date = formatDateLocal(istanbulCalendarToday());
    const booking = {id:"booking",start_time:`${date}T23:00:00Z`,status:"confirmed",student:{display_name:"Deniz",email:"deniz@example.com"}} as Booking;
    render(<AvailabilityCalendar availability={[]} bookings={[booking]} editable={false} />);
    assert.ok(screen.getByText("23:00 · Deniz"));
  } finally {if(original === undefined) delete process.env.TZ;else process.env.TZ=original;}
});
