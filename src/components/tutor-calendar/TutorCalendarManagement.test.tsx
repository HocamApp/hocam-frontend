import "@/test/setupDom";
import assert from "node:assert/strict";
import { afterEach, before, beforeEach, mock, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import api from "@/lib/api";
import type { TutorTimeOff } from "@/lib/tutorCalendar";
mock.module("next/link", { defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={String(href)} {...props}>{children}</a> });
let Management: typeof import("./TutorCalendarManagement").TutorCalendarManagement;
let started: typeof import("./TutorCalendarManagement").timeOffStarted;
before(async () => { const mod = await import("./TutorCalendarManagement"); Management = mod.TutorCalendarManagement; started = mod.timeOffStarted; });
let client: QueryClient;
let writes: Array<{method: string;url: string;data: Record<string, unknown>}>;
let fail: boolean;
const row: TutorTimeOff = { id: "off1", local_date: "2099-09-12", all_day: false, start_time: "14:00:00", end_time: "15:00:00", description: "Özel", created_at: "", updated_at: "" };
beforeEach(() => {
  fail = false; writes = [];
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  api.defaults.adapter = async config => {
    const method = config.method || "get";
    if (method !== "get") {
      writes.push({method,url: config.url!,data: config.data ? JSON.parse(config.data) : {}});
      if (fail) throw {response:{data:{detail:"Bu saatte bir ders var.",conflict:{management_url:"/dashboard/tutor?tab=bookings&highlightBooking=lesson"}}}};
    }
    return {config, data: [],status:200,statusText:"OK",headers:{}};
  };
});
afterEach(() => {cleanup();client.clear();});
const mount = (selectedTimeOff?: TutorTimeOff) => render(<QueryClientProvider client={client}><Management date="2099-09-12" timeOff={[row]} events={[]} onChanged={() => {}} selectedTimeOff={selectedTimeOff} /></QueryClientProvider>);
test("timeoff posts a private all-day block with null times", async () => {
  mount(); fireEvent.click(screen.getByRole("button", {name:"Meşguliyet ekle"}));
  fireEvent.click(screen.getByRole("checkbox", {name:"Tüm gün"}));
  fireEvent.change(screen.getByLabelText("Özel açıklama (isteğe bağlı)"), {target:{value:"Randevu"}});
  assert.equal(screen.getByLabelText("Özel açıklama (isteğe bağlı)").getAttribute("maxlength"), "200");
  fireEvent.click(screen.getByRole("button", {name:"Kaydet"}));
  await waitFor(() => assert.equal(writes.length,1));
  assert.deepEqual(writes[0].data,{local_date:"2099-09-12",all_day:true,start_time:null,end_time:null,description:"Randevu"});
  await waitFor(() => assert.equal(screen.queryByRole("dialog"),null));
});
test("conflict preserves draft and exposes existing management link", async () => {
  fail = true; mount(row);
  await screen.findByRole("dialog");
  fireEvent.change(screen.getByLabelText("Özel açıklama (isteğe bağlı)"),{target:{value:"Taslağım"}});
  fireEvent.click(screen.getByRole("button", {name:"Kaydet"}));
  await screen.findByRole("alert");
  assert.equal((screen.getByLabelText("Özel açıklama (isteğe bağlı)") as HTMLTextAreaElement).value,"Taslağım");
  assert.equal(screen.getByRole("link",{name:"Çakışan kaydı aç"}).getAttribute("href"),"/dashboard/tutor?tab=bookings&highlightBooking=lesson");
  assert.equal(writes[0].method,"patch");
});
test("started block cannot edit but can be removed", async () => {
  mount({...row,local_date:"2020-09-12"});
  await screen.findByRole("dialog");
  assert.equal(screen.queryByRole("button",{name:"Kaydet"}),null);
  fireEvent.click(screen.getByRole("button",{name:"Meşguliyeti kaldır"}));
  await waitFor(() => assert.equal(writes[0]?.method,"delete"));
});
test("invalid interval does not write and new form resets prior draft", async () => {
  mount();fireEvent.click(screen.getByRole("button",{name:"Meşguliyet ekle"}));
  fireEvent.change(screen.getByLabelText("Başlangıç"),{target:{value:"15:00"}});
  fireEvent.change(screen.getByLabelText("Bitiş"),{target:{value:"14:00"}});
  fireEvent.click(screen.getByRole("button",{name:"Kaydet"}));
  await screen.findByRole("alert");assert.equal(writes.length,0);
  fireEvent.click(screen.getByRole("button",{name:"Vazgeç"}));
  fireEvent.click(screen.getByRole("button",{name:"Meşguliyet ekle"}));
  assert.equal((screen.getByLabelText("Başlangıç") as HTMLInputElement).value,"");
});
test("start check uses Istanbul instants including full-day midnight", () => {
  assert.equal(started({local_date:"2026-09-12",all_day:true,start_time:null},Date.parse("2026-09-11T21:00:00Z")),true);
  assert.equal(started({local_date:"2026-09-12",all_day:false,start_time:"00:15"},Date.parse("2026-09-11T21:00:00Z")),false);
});

test("availability can remove a closed date and return to weekly rules", async () => {
  api.defaults.adapter = async config => {
    if (config.method === "delete") writes.push({method:"delete",url:config.url!,data:{}});
    return {config,data:config.method === "get" && !writes.length ? [{id:"closed",day_of_week:5,specific_date:"2099-09-12",is_unavailable:true,start_time:null,end_time:null}] : [],status:200,statusText:"OK",headers:{}};
  };
  mount();fireEvent.click(screen.getByRole("button",{name:"Müsaitliği düzenle"}));
  const reset = await screen.findByRole("button",{name:"Tarih istisnasını kaldır"});
  fireEvent.click(reset);
  await waitFor(() => assert.equal(writes[0]?.url,"/availability/closed/"));
  await waitFor(() => assert.equal(screen.queryByText("Bu gün kapalı."),null));
});
test("availability load failure does not offer writes", async () => {
  api.defaults.adapter = async () => {throw new Error("offline");};
  mount();fireEvent.click(screen.getByRole("button",{name:"Müsaitliği düzenle"}));
  await screen.findByRole("alert");
  assert.ok((screen.getByRole("button",{name:"Ekle"}) as HTMLButtonElement).disabled);
  assert.ok(screen.getByRole("button",{name:"Yeniden dene"}));
});
