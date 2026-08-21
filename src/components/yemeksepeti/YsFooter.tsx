import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { FOOTER_CITY_CUISINES, FOOTER_LINKS, FOOTER_OTHER_CITIES } from "@/lib/yemeksepetiMock";

export function YsFooter() {
  return (
    <footer className="mt-12 border-t" style={{ borderColor: "var(--ys-neutral-divider)" }}>
      <div className="ys-shell py-8">
        <h4 className="mb-4 text-base font-semibold">Mutfaklar</h4>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {FOOTER_CITY_CUISINES.map((entry) => (
            <div key={entry.city}>
              <span className="ys-footer-link font-semibold">{entry.city}</span>
              <ul className="mt-2 space-y-1">
                {entry.cuisines.map((cuisine) => (
                  <li key={cuisine}>
                    <span className="ys-footer-link">{cuisine}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <h4 className="mb-3 mt-8 text-base font-semibold">Diğer Şehirler</h4>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {FOOTER_OTHER_CITIES.map((city) => (
            <li key={city}>
              <span className="ys-footer-link">{city}</span>
            </li>
          ))}
          <li>
            <span className="ys-footer-link font-semibold">Bütün Şehir ve Bölgeler</span>
          </li>
        </ul>

        <div
          className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-6"
          style={{ borderColor: "var(--ys-neutral-divider)" }}
        >
          <span className="ys-footer-link">English</span>
          <span className="ys-footer-link">© Yemeksepeti</span>
          {FOOTER_LINKS.map((link) => (
            <span key={link} className="ys-footer-link">
              {link}
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <span className="text-lg font-bold" style={{ color: "var(--ys-brand-primary)" }}>
            yemeksepeti
          </span>
          <span className="h-6 w-px" style={{ background: "var(--ys-neutral-divider)" }} aria-hidden />
          <div className="flex gap-2" aria-hidden>
            <span className="ys-icon-btn">
              <Linkedin className="h-5 w-5" />
            </span>
            <span className="ys-icon-btn">
              <Instagram className="h-5 w-5" />
            </span>
            <span className="ys-icon-btn">
              <Facebook className="h-5 w-5" />
            </span>
            <span className="ys-icon-btn">
              <Twitter className="h-5 w-5" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
