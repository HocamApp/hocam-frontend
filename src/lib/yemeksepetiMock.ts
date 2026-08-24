/**
 * Static content for the Yemeksepeti-shaped homepage chrome.
 *
 * Only the page chrome lives here — the vertical switcher tabs and the
 * campaign lane. Tutors, subjects and every filter option
 * come from the real Hocam API via `YsTutorDirectory`; the mock restaurant
 * catalogue this file used to hold was deleted with the mock filter panel.
 */

/**
 * The vertical switcher. Labels and icons are Hocam's own nav items (see
 * `src/components/layout/navItems.ts`); only the Yemeksepeti tab *shape* and
 * its hover animation are borrowed. Nothing here routes yet — the tabs are
 * presentational while the homepage design is being worked out.
 */
export const VERTICAL_TABS = [
  { id: "tutors", label: "Hocalar", icon: "GraduationCap" },
  { id: "dashboard", label: "Panelim", icon: "LayoutDashboard" },
  { id: "coaching", label: "Koçluk", icon: "Compass" },
  { id: "schedule", label: "Çalışma Programım", icon: "CalendarDays" },
] as const;

export const CAMPAIGNS = [
  { id: "c1", title: "Tüm ürünlerde %20 indirim", hue: 340 },
  { id: "c2", title: "Popeyes / Ekonomix Menü 330TL", hue: 24 },
  { id: "c3", title: "Burger King / Benim İkilim 320TL", hue: 12 },
  { id: "c4", title: "Coca-Cola Fırsat Menüleri'nde indirim!", hue: 356 },
  { id: "c5", title: "Arby's / 2'li Biftek Mini Menü 320TL", hue: 200 },
  { id: "c6", title: "Algida Menülerinde %10 %15 %20 İndirim", hue: 260 },
  { id: "c7", title: "BİRLİKTEN LEZZET DOĞAR-Darüşşafaka", hue: 160 },
] as const;
