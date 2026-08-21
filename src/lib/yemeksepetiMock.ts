/**
 * Static content for the Yemeksepeti-shaped homepage chrome.
 *
 * Only the page chrome lives here — the vertical switcher tabs, the campaign
 * lane and the footer link lists. Tutors, subjects and every filter option
 * come from the real Hocam API via `YsTutorDirectory`; the mock restaurant
 * catalogue this file used to hold was deleted with the mock filter panel.
 */

export const VERTICAL_TABS = [
  { id: "tutors", label: "Hocalar" },
  { id: "pickup", label: "Gel Al" },
  { id: "ymarket", label: "Y-Market" },
  { id: "markets", label: "Marketler" },
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

export const FOOTER_CITY_CUISINES = [
  {
    city: "İstanbul",
    cuisines: ["Burger", "Pizza", "Kebap & Türk Mutfağı", "Döner", "Tost & Sandviç", "Tavuk", "Pide & Lahmacun", "Tatlı"],
  },
  {
    city: "Ankara",
    cuisines: ["Döner", "Burger", "Kebap & Türk Mutfağı", "Pizza", "Çiğ Köfte", "Tavuk", "Pide & Lahmacun", "Tost & Sandviç"],
  },
  {
    city: "Izmir",
    cuisines: ["Döner", "Pizza", "Pide & Lahmacun", "Burger", "Kebap & Türk Mutfağı", "Tost & Sandviç", "Çiğ Köfte", "Tavuk"],
  },
  {
    city: "Antalya",
    cuisines: ["Burger", "Döner", "Kebap & Türk Mutfağı", "Pizza", "Tost & Sandviç", "Tavuk", "Çiğ Köfte", "Pide & Lahmacun"],
  },
] as const;

export const FOOTER_OTHER_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Artvin", "Aydın", "Balıkesir",
  "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Çanakkale", "Çankırı", "Çorum",
  "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep",
  "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta", "Mersin", "Kars", "Kastamonu",
  "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa",
  "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Rize",
  "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon",
  "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt",
  "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova",
  "Karabük", "Kilis", "Osmaniye", "Düzce", "KKTC",
] as const;

export const FOOTER_LINKS = [
  "Yardım Merkezi",
  "Kullanım Koşulları",
  "S.S.S. ve İşlem Rehberi",
  "Çerez Politikası",
  "İletişim",
  "İş Ortağımız Olun",
  "Kurumsal Site",
  "Aydınlatma Metni",
  "Kişisel Verilerin Korunması ve İşlenmesi ve Gizlilik Politikası",
  "Bilgi Toplumu Hizmetleri",
  "Yemeksepeti app indir",
  "Türkiye'deki tüm şehirler",
] as const;
