// The app mark, one source for every icon size.
// node tools/icon.mjs full|foreground|mono | rsvg-convert -w N -h N -o out.png

// Clock hour to a point on the 1024 canvas. 12 is straight up, SVG angles start at 3 o'clock.
const at = (hour, radius) => {
  const angle = ((hour * 30 - 90) * Math.PI) / 180;
  return `${(512 + radius * Math.cos(angle)).toFixed(1)} ${(512 + radius * Math.sin(angle)).toFixed(1)}`;
};

// A clock with the worked hours swept in the money accent: time turned into an amount.
const mark = (ring, accent) => `
  ${ring ? `<circle cx="512" cy="512" r="310" fill="none" stroke="${ring}" stroke-width="90"/>` : ''}
  <path d="M ${at(12, 310)} A 310 310 0 0 1 ${at(4, 310)}" fill="none" stroke="${accent}"
        stroke-width="90" stroke-linecap="round"/>
  <path d="M 512 512 L ${at(12, 196)} M 512 512 L ${at(4, 148)}" fill="none" stroke="${accent}"
        stroke-width="52" stroke-linecap="round"/>`;

// Adaptive icon layers only guarantee the centre 66%, so they shrink to stay inside it.
const safe = (body) => `<g transform="translate(512 512) scale(0.86) translate(-512 -512)">${body}</g>`;

const variants = {
  full: `<rect width="1024" height="1024" fill="#101418"/>${mark('#2A343D', '#6FE3A0')}`,
  foreground: safe(mark('#2A343D', '#6FE3A0')),
  // Themed icons are tinted a single colour, so the ring and the swept hours merge into one.
  mono: safe(mark('#FFFFFF', '#FFFFFF')),
};

const svg = variants[process.argv[2]];
if (!svg) throw new Error(`unknown variant: ${process.argv[2]}`);
process.stdout.write(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${svg}</svg>\n`);
