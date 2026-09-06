import "@/test/setupDom";
import assert from "node:assert/strict";
import { afterEach, before, test, mock } from "node:test";
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AvailabilityRule } from "@/types";
let fail = false;
const rules = [
  {id:"weekly",tutor:"t",day_of_week:0,start_time:"09:00",end_time:"10:00",created_at:""},
  {id:"date",tutor:"t",day_of_week:0,specific_date:"2026-09-07",start_time:"14:00",end_time:"15:00",created_at:""},
  {id:"closed",tutor:"t",day_of_week:0,specific_date:"2026-09-14",is_unavailable:true,start_time:null,end_time:null,created_at:""},
] as unknown as AvailabilityRule[];
mock.module("@/lib/dashboardApi", {namedExports:{
  fetchAvailability:async () => {if(fail) throw new Error("offline"); return rules;},
  createAvailabilityRule:async () => rules[0], deleteAvailabilityRule:async () => undefined,
}});
let AvailabilityEditor: typeof import("./AvailabilityEditor").AvailabilityEditor;
before(async () => {AvailabilityEditor = (await import("./AvailabilityEditor")).AvailabilityEditor;});
afterEach(() => {act(() => cleanup());fail=false;});
function mount() {const client = new QueryClient({defaultOptions:{queries:{retry:false}}});render(<QueryClientProvider client={client}><AvailabilityEditor /></QueryClientProvider>);return client;}
test("weekly editor excludes date overrides and safely handles closed null hours", async () => {
  const client=mount(); await screen.findByRole("button",{name:"Pazartesi 09:00–10:00 saatini sil"});
  assert.equal(screen.queryByRole("button",{name:/14:00–15:00 saatini sil/}),null);assert.equal(screen.getAllByRole("button",{name:/saatini sil/}).length,1);client.clear();
});
test("weekly editor reports load errors and recovers on retry", async () => {
  fail=true;const client=mount();await screen.findByRole("alert");
  assert.equal((screen.getByRole("button",{name:"Ekle"}) as HTMLButtonElement).disabled,true);
  fail=false;fireEvent.click(screen.getByRole("button",{name:"Tekrar dene"}));
  await screen.findByRole("button",{name:"Pazartesi 09:00–10:00 saatini sil"});client.clear();
});
