/**
 * Porter stemmer (M.F. Porter, 1980), TypeScript port.
 *
 * The algorithm is public domain; this is a direct implementation of the six
 * step ruleset from the original paper. It is intentionally dependency-free so
 * the engine stays self-contained. Results match the canonical Porter output
 * for the standard vocabulary/output test pair.
 */

const step2list: Record<string, string> = {
  ational: 'ate',
  tional: 'tion',
  enci: 'ence',
  anci: 'ance',
  izer: 'ize',
  bli: 'ble',
  alli: 'al',
  entli: 'ent',
  eli: 'e',
  ousli: 'ous',
  ization: 'ize',
  ation: 'ate',
  ator: 'ate',
  alism: 'al',
  iveness: 'ive',
  fulness: 'ful',
  ousness: 'ous',
  aliti: 'al',
  iviti: 'ive',
  biliti: 'ble',
  logi: 'log',
};

const step3list: Record<string, string> = {
  icate: 'ic',
  ative: '',
  alize: 'al',
  iciti: 'ic',
  ical: 'ic',
  ful: '',
  ness: '',
};

const c = '[^aeiou]';
const v = '[aeiouy]';
const C = `${c}[^aeiouy]*`;
const V = `${v}[aeiou]*`;

const mgr0 = new RegExp(`^(${C})?${V}${C}`);
const meq1 = new RegExp(`^(${C})?${V}${C}(${V})?$`);
const mgr1 = new RegExp(`^(${C})?${V}${C}${V}${C}`);
const sV = new RegExp(`^(${C})?${v}`);

/** Stem a single already-lowercased token. */
export function stem(word: string): string {
  if (word.length < 3) return word;

  let w = word;
  let stem_: string;
  let re: RegExp;
  let re2: RegExp;
  let re3: RegExp;
  let re4: RegExp;

  // Step 1a
  if (w.startsWith('y')) w = 'Y' + w.slice(1);

  re = /^(.+?)(ss|i)es$/;
  re2 = /^(.+?)([^s])s$/;
  if (re.test(w)) w = w.replace(re, '$1$2');
  else if (re2.test(w)) w = w.replace(re2, '$1$2');

  // Step 1b
  re = /^(.+?)eed$/;
  re2 = /^(.+?)(ed|ing)$/;
  if (re.test(w)) {
    const fp = re.exec(w)!;
    re = new RegExp(mgr0.source);
    if (re.test(fp[1]!)) w = w.slice(0, -1);
  } else if (re2.test(w)) {
    const fp = re2.exec(w)!;
    stem_ = fp[1]!;
    re2 = new RegExp(sV.source);
    if (re2.test(stem_)) {
      w = stem_;
      re2 = /(at|bl|iz)$/;
      re3 = /([^aeiouylsz])\1$/;
      re4 = new RegExp(`^${C}${v}[^aeiouwxy]$`);
      if (re2.test(w)) w = w + 'e';
      else if (re3.test(w)) w = w.slice(0, -1);
      else if (re4.test(w)) w = w + 'e';
    }
  }

  // Step 1c
  re = /^(.+?)y$/;
  if (re.test(w)) {
    const fp = re.exec(w)!;
    stem_ = fp[1]!;
    re = new RegExp(sV.source);
    if (re.test(stem_)) w = stem_ + 'i';
  }

  // Step 2
  re =
    /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
  if (re.test(w)) {
    const fp = re.exec(w)!;
    stem_ = fp[1]!;
    const suffix = fp[2]!;
    re = new RegExp(mgr0.source);
    if (re.test(stem_)) w = stem_ + step2list[suffix];
  }

  // Step 3
  re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
  if (re.test(w)) {
    const fp = re.exec(w)!;
    stem_ = fp[1]!;
    const suffix = fp[2]!;
    re = new RegExp(mgr0.source);
    if (re.test(stem_)) w = stem_ + step3list[suffix];
  }

  // Step 4
  re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
  re2 = /^(.+?)(s|t)(ion)$/;
  if (re.test(w)) {
    const fp = re.exec(w)!;
    stem_ = fp[1]!;
    re = new RegExp(mgr1.source);
    if (re.test(stem_)) w = stem_;
  } else if (re2.test(w)) {
    const fp = re2.exec(w)!;
    stem_ = fp[1]! + fp[2]!;
    re2 = new RegExp(mgr1.source);
    if (re2.test(stem_)) w = stem_;
  }

  // Step 5
  re = /^(.+?)e$/;
  if (re.test(w)) {
    const fp = re.exec(w)!;
    stem_ = fp[1]!;
    re = new RegExp(mgr1.source);
    re2 = new RegExp(meq1.source);
    re3 = new RegExp(`^${C}${v}[^aeiouwxy]$`);
    if (re.test(stem_) || (re2.test(stem_) && !re3.test(stem_))) w = stem_;
  }

  re = /ll$/;
  re2 = new RegExp(mgr1.source);
  if (re.test(w) && re2.test(w)) w = w.slice(0, -1);

  // Turn initial Y back to y
  if (w.startsWith('Y')) w = 'y' + w.slice(1);

  return w;
}
