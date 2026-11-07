import zxcvbn from 'zxcvbn';

// Password AI: zxcvbn guesses how long a hacker needs to crack a password.
// (zxcvbn knows common passwords, names, keyboard walks like "qwerty" and patterns like "1234",
//  so "Password1" is rated weak even though it has a capital letter and a number.)
//
// We use the time for a hacker who can try 10 guesses every second (an online attack).
// (zxcvbn counts a random character as 10 possibilities, so 10 random characters = 10 billion guesses.)

export const TIERS = { weak: 'weak', medium: 'medium', strong: 'strong' };
const DAY = 86400;
const YEAR = 31536000;

// seconds -> how strong it is, from 0 (instant) to 1 (centuries)
export function strengthFromSeconds(seconds) {
  const log = Math.log10(Math.max(seconds, 0.001));
  return Math.min(1, Math.max(0, (log + 3) / 13));
}

// weak: cracked within a month, strong: needs more than 30 years
export function tierFromSeconds(seconds) {
  if (seconds < 30 * DAY) return TIERS.weak;
  if (seconds < 30 * YEAR) return TIERS.medium;
  return TIERS.strong;
}

// Returns { seconds, strength (0..1), tier, score (0..4, from zxcvbn) }
export function ratePassword(password) {
  if (!password) return { seconds: 0, strength: 0, tier: TIERS.weak, score: 0 };
  const result = zxcvbn(password);
  const seconds = result.crack_times_seconds.online_no_throttling_10_per_second;
  return { seconds, strength: strengthFromSeconds(seconds), tier: tierFromSeconds(seconds), score: result.score };
}

// Crack time in words. Returns a text key and a number for i18n,
// for example { key: 'time.days', n: 2 } -> "2 days".
export function crackTimeWords(seconds) {
  const units = [
    [60, 'seconds', 1],
    [3600, 'minutes', 60],
    [DAY, 'hours', 3600],
    [30 * DAY, 'days', DAY],
    [YEAR, 'months', 30 * DAY],
    [100 * YEAR, 'years', YEAR],
  ];
  if (seconds < 1) return { key: 'time.instant', n: 0 };
  for (const [limit, name, size] of units) {
    if (seconds < limit) {
      const n = Math.max(1, Math.round(seconds / size));
      return { key: n === 1 ? `time.${name}One` : `time.${name}`, n };
    }
  }
  return { key: 'time.centuries', n: 0 };
}

// How much damage one hammer hit does to a wall, from the crack time (log scale):
// a password that is cracked instantly takes about 34 damage, a very strong one only 2.
export function hammerDamage(seconds) {
  const log = Math.log10(Math.max(seconds, 0.001));
  const t = Math.min(1, Math.max(0, (log + 3) / 12));
  return Math.round(34 - t * 32);
}
