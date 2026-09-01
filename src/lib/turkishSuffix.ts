/**
 * Turkish dative suffix for a name, with the apostrophe proper nouns take.
 *
 * "Ayşe" + "e" is not "Ayşe'e" — the suffix harmonises with the last vowel
 * and grows a buffer consonant after a vowel, so it is "Ayşe'ye", "Mehmet'e",
 * "Burak'a", "Zeynep'e", "Su'ya". Getting this wrong is the kind of thing a
 * 17-year-old reads as the site not being written by anyone who speaks the
 * language.
 */

const BACK_VOWELS = new Set(["a", "ı", "o", "u"]);
const FRONT_VOWELS = new Set(["e", "i", "ö", "ü"]);
const VOWELS = new Set(
  Array.from(BACK_VOWELS).concat(Array.from(FRONT_VOWELS)),
);

/** "Ayşe" → "Ayşe'ye", "Mehmet" → "Mehmet'e". Empty name → empty string. */
export function dativeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";

  const lower = trimmed.toLocaleLowerCase("tr-TR");
  const lastVowel = Array.from(lower).reverse().find((char) => VOWELS.has(char));
  // No vowel at all (an initialism, say): fall back to the front form, which
  // is what Turkish does with letter names like "TV'ye".
  const suffixVowel = lastVowel && BACK_VOWELS.has(lastVowel) ? "a" : "e";

  const lastChar = lower[lower.length - 1];
  const buffer = VOWELS.has(lastChar) ? "y" : "";

  return `${trimmed}'${buffer}${suffixVowel}`;
}
