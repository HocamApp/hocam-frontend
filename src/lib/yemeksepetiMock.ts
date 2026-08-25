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
  { id: "dashboard", label: "Panelim", icon: "SquaresFour" },
  { id: "coaching", label: "Koçluk", icon: "Compass" },
  { id: "schedule", label: "Çalışma Programım", icon: "CalendarBlank" },
] as const;
