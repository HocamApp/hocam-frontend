/**
 * Mock data for the Yemeksepeti-inspired homepage experiment.
 *
 * Every value here is static and local. The experiment deliberately ships with
 * no network calls, no analytics, no cookie consent and no third-party SDKs —
 * the branch only reproduces layout and visual structure so the design can be
 * reworked for Hocam afterwards.
 */

export type Vendor = {
  id: string;
  name: string;
  /** Absent for brand-new vendors — the tile shows a "Yeni" tag instead. */
  rating?: string;
  reviewCount: string;
  promoted?: boolean;
  deliveryTime: string;
  priceRange: string;
  minBasket: string;
  cuisine: string;
  /** Shown struck through when `deliveryFeeNote` is present. */
  deliveryFee: string;
  deliveryFeeNote?: string;
  dealTags?: string[];
  /** Drives the placeholder tile gradient — no vendor photography is bundled. */
  hue: number;
};

export const VERTICAL_TABS = [
  { id: "restaurant", label: "Restoran" },
  { id: "pickup", label: "Gel Al" },
  { id: "ymarket", label: "Y-Market" },
  { id: "markets", label: "Marketler" },
] as const;

export const SORT_OPTIONS = [
  { id: "sort_relevance", label: "Önerilen (Varsayılan)" },
  { id: "delivery_time_asc", label: "Teslimat Süresi" },
  { id: "distance_asc", label: "Mesafe" },
  { id: "rating_desc", label: "Restoran Puanı" },
] as const;

export const QUICK_FILTERS = [{ id: "platform_delivery", label: "Express teslimat" }] as const;

export const CUISINE_FILTERS = [
  { id: "1057", label: "Balık ve Deniz Ürünleri" },
  { id: "1058", label: "Burger" },
  { id: "1059", label: "Cağ Kebap" },
  { id: "1060", label: "Dondurma" },
  { id: "1061", label: "Döner" },
  { id: "1062", label: "Dünya Mutfağı" },
  { id: "1063", label: "Ev Yemekleri" },
  { id: "1064", label: "Kahvaltı & Börek" },
  { id: "1065", label: "Kahve" },
] as const;

export const PAYMENT_FILTERS = [
  { id: "", label: "Tümü" },
  { id: "yemekpay_creditcard", label: "Online Kredi Kartı/Banka Kartı" },
  { id: "cash", label: "Nakit" },
  { id: "yemekpay_cardondelivery", label: "Kapıda Temassız Kartla Ödeme" },
  { id: "yemekpay_cardpayment", label: "Kapıda Kredi Kartı" },
  { id: "craftgate_edenred", label: "Ticket Restaurant Online" },
] as const;

export const BUDGET_FILTERS = [
  { id: "1", label: "₺" },
  { id: "2", label: "₺₺" },
  { id: "3", label: "₺₺₺" },
] as const;

export const MIN_BASKET_MAX = 450;

export const CAMPAIGNS = [
  { id: "c1", title: "Tüm ürünlerde %20 indirim", hue: 340 },
  { id: "c2", title: "Popeyes / Ekonomix Menü 330TL", hue: 24 },
  { id: "c3", title: "Burger King / Benim İkilim 320TL", hue: 12 },
  { id: "c4", title: "Coca-Cola Fırsat Menüleri'nde indirim!", hue: 356 },
  { id: "c5", title: "Arby's / 2'li Biftek Mini Menü 320TL", hue: 200 },
  { id: "c6", title: "Algida Menülerinde %10 %15 %20 İndirim", hue: 260 },
  { id: "c7", title: "BİRLİKTEN LEZZET DOĞAR-Darüşşafaka", hue: 160 },
] as const;

export const VENDORS: Vendor[] = [
  { id: "pyp9", name: "Kuşgözü Lahmacun", rating: "4.7", reviewCount: "500+", promoted: true, deliveryTime: "25-40 min", priceRange: "₺₺₺", minBasket: "0 TL minimum", cuisine: "Kebap & Türk Mutfağı", deliveryFee: "Ücretsiz", hue: 12 },
  { id: "d91s", name: "Dönerist", rating: "4.4", reviewCount: "30000+", promoted: true, deliveryTime: "20-35 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 500TL", cuisine: "Döner", deliveryFee: "Ücretsiz", dealTags: ["Kupon: GELAL30"], hue: 340 },
  { id: "pxys", name: "Tavuk Box", rating: "4.3", reviewCount: "100+", promoted: true, deliveryTime: "20-35 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Tavuk", deliveryFee: "Ücretsiz", dealTags: ["Cocacoladeals"], hue: 28 },
  { id: "j0ae", name: "Kuzen Kanat", rating: "4.3", reviewCount: "500+", promoted: true, deliveryTime: "25-40 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Tavuk", deliveryFee: "Ücretsiz", dealTags: ["Cocacoladeals"], hue: 45 },
  { id: "r2tt", name: "PR Ciğer & Kavurma", rating: "4.2", reviewCount: "30", promoted: true, deliveryTime: "5-20 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Kebap & Türk Mutfağı", deliveryFee: "14,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", dealTags: ["Tüm ürünlerde %15"], hue: 200 },
  { id: "aiqw", name: "33 Suat Usta Mersin Tantuni", rating: "4.5", reviewCount: "65000+", promoted: true, deliveryTime: "20-35 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 50TL", cuisine: "Tantuni", deliveryFee: "Ücretsiz", dealTags: ["Kupon: GELAL30"], hue: 160 },
  { id: "zy71", name: "Pidem", rating: "3.6", reviewCount: "1000+", promoted: true, deliveryTime: "25-35 min", priceRange: "₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Pide & Lahmacun", deliveryFee: "14,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", dealTags: ["Cocacoladeals"], hue: 260 },
  { id: "ng8s", name: "Hopdaddy Burger", rating: "4.4", reviewCount: "3000+", promoted: true, deliveryTime: "30-45 min", priceRange: "₺₺₺", minBasket: "Min. sepet tutarı 2.499TL", cuisine: "Burger", deliveryFee: "Ücretsiz", hue: 300 },
  { id: "f4hd", name: "Pizza Coco Pazzo", rating: "4.4", reviewCount: "100+", promoted: true, deliveryTime: "25-40 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Pizza", deliveryFee: "Ücretsiz", dealTags: ["Tüm ürünlerde %20"], hue: 18 },
  { id: "p2ic", name: "İsot-chi Kuzu Lahmacun", rating: "4.4", reviewCount: "93", promoted: true, deliveryTime: "5-20 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Kebap & Türk Mutfağı", deliveryFee: "14,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", hue: 96 },
  { id: "c6ux", name: "McDonald's", rating: "2.6", reviewCount: "135000+", deliveryTime: "15-25 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Burger", deliveryFee: "14,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", dealTags: ["Cocacoladeals"], hue: 12 },
  { id: "bm4p", name: "Burger King", rating: "3.3", reviewCount: "500+", deliveryTime: "20-35 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 250TL", cuisine: "Burger", deliveryFee: "Ücretsiz", dealTags: ["Cocacoladeals"], hue: 340 },
  { id: "n6eg", name: "Always Waffle", rating: "4.1", reviewCount: "1000+", deliveryTime: "5-20 min", priceRange: "₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Waffle", deliveryFee: "4,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", hue: 28 },
  { id: "lw4g", name: "Pizza Bulls", rating: "4.8", reviewCount: "5000+", deliveryTime: "20-35 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 400TL", cuisine: "Pizza", deliveryFee: "Ücretsiz", dealTags: ["Tüm ürünlerde %20", "Cocacoladeals"], hue: 45 },
  { id: "bqkj", name: "Carl's Jr.", rating: "3.9", reviewCount: "4000+", deliveryTime: "15-25 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Burger", deliveryFee: "4,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", dealTags: ["Kupon: GELAL30"], hue: 200 },
  { id: "rxus", name: "BRGR Smash Burger. Fries", reviewCount: "", deliveryTime: "5-20 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Burger", deliveryFee: "14,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", dealTags: ["Yeni"], hue: 160 },
  { id: "h1dx", name: "Dürümle", rating: "4", reviewCount: "100+", deliveryTime: "15-25 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Kebap & Türk Mutfağı", deliveryFee: "4,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", dealTags: ["Seçili ürünlerde %18"], hue: 260 },
  { id: "do89", name: "Arby's", rating: "3.6", reviewCount: "5000+", deliveryTime: "5-20 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Burger", deliveryFee: "4,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", dealTags: ["Cocacoladeals"], hue: 300 },
  { id: "hzcc", name: "Baazen Tantuni", rating: "4.2", reviewCount: "35000+", deliveryTime: "5-20 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Tantuni", deliveryFee: "4,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", dealTags: ["Kupon: GELAL30"], hue: 18 },
  { id: "wi4n", name: "Domino's Pizza", rating: "3.9", reviewCount: "35000+", deliveryTime: "20-35 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 400TL", cuisine: "Pizza", deliveryFee: "Ücretsiz", dealTags: ["Cocacoladeals"], hue: 96 },
  { id: "ysl8", name: "HD İskender", rating: "4.2", reviewCount: "1000+", deliveryTime: "20-30 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Döner", deliveryFee: "4,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", dealTags: ["Cocacoladeals"], hue: 12 },
  { id: "agl6", name: "Ars Kebap", reviewCount: "", deliveryTime: "30-45 min", priceRange: "₺₺", minBasket: "0 TL minimum", cuisine: "Kebap & Türk Mutfağı", deliveryFee: "Ücretsiz", dealTags: ["Yeni"], hue: 340 },
  { id: "akwm", name: "Günaydın Köfte & Döner", rating: "4", reviewCount: "500+", deliveryTime: "15-25 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Köfte", deliveryFee: "4,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", dealTags: ["Seçili ürünlerde %20", "Cocacoladeals"], hue: 28 },
  { id: "x2qi", name: "Çıtırdan Pide & Kebap & Lahmacun", rating: "4", reviewCount: "500+", deliveryTime: "25-40 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 150TL", cuisine: "Pide & Lahmacun", deliveryFee: "Ücretsiz", dealTags: ["Cocacoladeals"], hue: 45 },
  { id: "y30u", name: "Köfteci Yusuf", rating: "3.6", reviewCount: "10000+", deliveryTime: "15-25 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Köfte", deliveryFee: "24,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", dealTags: ["Cocacoladeals"], hue: 200 },
  { id: "dupe", name: "Meşhur Gültepe Pilavcısı", rating: "4.4", reviewCount: "5000+", deliveryTime: "5-20 min", priceRange: "₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Pilav", deliveryFee: "4,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", dealTags: ["Tüm ürünlerde %20"], hue: 160 },
  { id: "xfsi", name: "Tavuk Dünyası", rating: "4.3", reviewCount: "500+", deliveryTime: "20-30 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Tavuk", deliveryFee: "4,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", hue: 260 },
  { id: "wnsp", name: "Maydonoz Döner", rating: "4.1", reviewCount: "2000+", deliveryTime: "5-20 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Döner", deliveryFee: "24,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", dealTags: ["Seçili ürünlerde %15", "Algida menuleri"], hue: 300 },
  { id: "suxt", name: "Mine Bakery", reviewCount: "", deliveryTime: "50-70 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 379TL", cuisine: "Pastane & Fırın", deliveryFee: "Ücretsiz", dealTags: ["Yeni"], hue: 18 },
  { id: "xwlt", name: "Saray Muhallebicisi 1935", rating: "3.9", reviewCount: "25000+", deliveryTime: "5-20 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Tatlı", deliveryFee: "4,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", dealTags: ["Cocacoladeals"], hue: 96 },
  { id: "w4dx", name: "Kanyon Waffle", rating: "4.5", reviewCount: "500+", deliveryTime: "5-20 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Waffle", deliveryFee: "4,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", hue: 12 },
  { id: "vzep", name: "Kebo", rating: "4.2", reviewCount: "1000+", deliveryTime: "5-20 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Döner", deliveryFee: "4,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", dealTags: ["Tüm ürünlerde %15", "Cocacoladeals"], hue: 340 },
  { id: "o21k", name: "Green Salads", rating: "3.8", reviewCount: "1000+", deliveryTime: "10-25 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Tavuk", deliveryFee: "4,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", hue: 28 },
  { id: "fn65", name: "Öncü Döner", rating: "4.4", reviewCount: "4000+", deliveryTime: "5-20 min", priceRange: "₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Döner", deliveryFee: "24,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", hue: 45 },
  { id: "upuk", name: "Dürümcü Sedat Usta", rating: "4.3", reviewCount: "25000+", deliveryTime: "5-20 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Kebap & Türk Mutfağı", deliveryFee: "14,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", hue: 200 },
  { id: "utar", name: "Ağaoğlu Pilav", reviewCount: "", deliveryTime: "50-70 min", priceRange: "₺₺", minBasket: "0 TL minimum", cuisine: "Pilav", deliveryFee: "Ücretsiz", dealTags: ["Yeni", "Tüm ürünlerde %20"], hue: 160 },
  { id: "e2x2", name: "Shake Shack", rating: "4", reviewCount: "100+", deliveryTime: "20-30 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Burger", deliveryFee: "14,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", dealTags: ["Seçili ürünlerde %34", "Cocacoladeals"], hue: 260 },
  { id: "hnkc", name: "Bakırda Kuru", rating: "3.7", reviewCount: "55000+", deliveryTime: "5-20 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Ev Yemekleri", deliveryFee: "4,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", dealTags: ["Tüm ürünlerde %20", "Kupon: GELAL30"], hue: 300 },
  { id: "a2aj", name: "Adanalı Kebapçı Mehmet", rating: "4.4", reviewCount: "100+", deliveryTime: "5-20 min", priceRange: "₺₺₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Kebap & Türk Mutfağı", deliveryFee: "4,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", dealTags: ["Tüm ürünlerde %15", "Cocacoladeals"], hue: 18 },
  { id: "rp1q", name: "Popeyes", rating: "3.3", reviewCount: "100+", deliveryTime: "20-35 min", priceRange: "₺₺", minBasket: "Min. sepet tutarı 250TL", cuisine: "Tavuk", deliveryFee: "Ücretsiz", dealTags: ["Cocacoladeals"], hue: 96 },
  { id: "uotr", name: "Meşhur Çeliktepe Pilavcısı", rating: "3.9", reviewCount: "40000+", deliveryTime: "5-20 min", priceRange: "₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Pilav", deliveryFee: "4,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", dealTags: ["Tüm ürünlerde %20"], hue: 12 },
  { id: "kdr3", name: "Hey Döner", rating: "3.7", reviewCount: "500+", deliveryTime: "5-20 min", priceRange: "₺", minBasket: "Min. sepet tutarı 300TL", cuisine: "Döner", deliveryFee: "14,99TL", deliveryFeeNote: "İlk siparişte ücretsiz teslimat", dealTags: ["Seçili ürünlerde %11", "Cocacoladeals"], hue: 340 },
];

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
