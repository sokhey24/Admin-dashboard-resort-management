const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, 'src', 'page');

function walk(dir) {
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) out.push(...walk(full));
    else if (f.endsWith('.jsx')) out.push(full);
  }
  return out;
}

function rep(str, from, to) {
  let s = str;
  while (s.includes(from)) s = s.split(from).join(to);
  return s;
}

const files = walk(BASE);
let updated = 0;

for (const file of files) {
  let c = fs.readFileSync(file, 'utf8');
  const orig = c;

  // ── 1. INPUT HEIGHT/RADIUS/FONT/PADDING ─────────────────────────
  // Old: rounded-lg px-3 py-2 text-sm
  c = rep(c, 'rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2',
             'rounded-[10px] px-5 py-3 text-[17px] focus:outline-none focus:ring-2');
  // Old partial: rounded-[10px] px-5 py-2.5 text-[15px]
  c = rep(c, 'rounded-[10px] px-5 py-2.5 text-[15px] focus:outline-none focus:ring-2',
             'rounded-[10px] px-5 py-3 text-[17px] focus:outline-none focus:ring-2');
  // Old partial: rounded-[10px] px-5 py-3 text-[15px]
  c = rep(c, 'rounded-[10px] px-5 py-3 text-[15px] focus:outline-none focus:ring-2',
             'rounded-[10px] px-5 py-3 text-[17px] focus:outline-none focus:ring-2');
  // Booking.jsx inline inputClass
  c = rep(c, 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40',
             'w-full border rounded-[10px] px-5 py-3 text-[17px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20');

  // ── 2. FOCUS RING → orange 20% opacity ──────────────────────────
  c = rep(c, 'focus:ring-[#FF6B00]/30', 'focus:ring-[#FF6B00]/20');
  c = rep(c, 'focus:ring-[#FF6B00]/40', 'focus:ring-[#FF6B00]/20');
  c = rep(c, 'focus:ring-red-400/40',   'focus:ring-red-400/20');

  // ── 3. SEARCH BAR rounded-lg → rounded-[10px] ───────────────────
  c = rep(c, 'rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 w-48',
             'rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 w-48');
  c = rep(c, 'rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48',
             'rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 w-48');

  // ── 4. PLACEHOLDER COLOR ─────────────────────────────────────────
  c = rep(c, 'placeholder-[#829AB1]', 'placeholder:text-[#829AB1]');

  // ── 5. LABEL SIZE: text-sm font-medium → text-[14px] font-semibold
  c = rep(c, 'block text-sm font-medium text-[#486581] mb-1',
             'block text-[14px] font-semibold text-[#486581] mb-1');
  c = rep(c, 'block text-sm font-medium text-[#486581]',
             'block text-[14px] font-semibold text-[#486581]');

  // ── 6. HELPER TEXT: text-xs → text-[13px] ───────────────────────
  // Only for standalone helper/error messages, not badges
  c = rep(c, 'mt-1 text-xs text-red-500', 'mt-1 text-[13px] text-red-500');
  c = rep(c, 'mt-1 text-xs text-[#829AB1]', 'mt-1 text-[13px] text-[#829AB1]');

  // ── 7. MODAL TITLE: text-base font-semibold → text-[18px] font-semibold
  c = rep(c, 'text-base font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}',
             'text-[18px] font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}');

  // ── 8. CARD BORDER RADIUS: rounded-lg → rounded-xl (modals/cards) ─
  c = rep(c, 'rounded-xl shadow-2xl w-full max-w-md p-6',
             'rounded-xl shadow-2xl w-full max-w-md p-7');
  c = rep(c, 'rounded-xl shadow-2xl w-full max-w-lg p-6',
             'rounded-xl shadow-2xl w-full max-w-lg p-7');
  c = rep(c, 'rounded-xl shadow-2xl w-full max-w-sm p-6',
             'rounded-xl shadow-2xl w-full max-w-sm p-7');

  // ── 9. CANCEL BUTTON: rounded-lg → rounded-[8px] ────────────────
  c = rep(c, 'px-4 py-2 text-sm rounded-lg border transition-colors',
             'px-4 py-2 text-[14px] rounded-[8px] border transition-colors');
  c = rep(c, 'px-4 py-2 text-sm rounded-lg bg-red-600',
             'px-4 py-2 text-[14px] rounded-[8px] bg-red-600');
  c = rep(c, 'px-4 py-2 text-sm rounded-lg bg-purple-600',
             'px-4 py-2 text-[14px] rounded-[8px] bg-purple-600');

  // ── 10. SAVE BUTTON: text-sm → text-[14px] ──────────────────────
  c = rep(c, 'px-4 py-2 text-sm rounded-[8px] bg-[#FF6B00]',
             'px-4 py-2 text-[14px] rounded-[8px] bg-[#FF6B00]');

  // ── 11. PAGE WRAPPER FONT ────────────────────────────────────────
  // Already set via style prop in most files — ensure it's present
  // (handled by existing code, skip)

  if (c !== orig) {
    fs.writeFileSync(file, c, 'utf8');
    updated++;
    console.log('Updated:', path.relative(BASE, file));
  }
}

console.log('\nDone. Files updated:', updated, '/', files.length);
