function svgToImg(svgText) {
  const blob = new Blob([svgText], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

function ghostSvg({ fill = '#ffffff', stroke = '#7c5cff', eyes = '#0b1020' } = {}) {
  // simple cute ghost
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="rgba(0,0,0,0.35)"/>
    </filter>
  </defs>
  <g filter="url(#s)">
    <path d="M128 30c-50 0-76 35-76 78v80c0 10 10 18 20 14l14-6 16 10 16-10 16 10 16-10 16 10 14-6c10 4 20-4 20-14v-80c0-43-26-78-76-78z" fill="${fill}" stroke="${stroke}" stroke-width="10" stroke-linejoin="round"/>
    <circle cx="100" cy="116" r="16" fill="${eyes}"/>
    <circle cx="156" cy="116" r="16" fill="${eyes}"/>
    <path d="M110 150c10 12 26 12 36 0" fill="none" stroke="${eyes}" stroke-width="10" stroke-linecap="round"/>
    <circle cx="90" cy="86" r="10" fill="${stroke}" opacity="0.35"/>
    <circle cx="174" cy="78" r="8" fill="${stroke}" opacity="0.25"/>
  </g>
</svg>`;
}

function bowSvg({ stroke = '#ffd166', grip = '#8d5524' } = {}) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <path d="M64 40c70 50 70 126 0 176" fill="none" stroke="${stroke}" stroke-width="18" stroke-linecap="round"/>
  <path d="M64 40c20 18 34 40 42 64" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="8" stroke-linecap="round"/>
  <path d="M64 216c20-18 34-40 42-64" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="8" stroke-linecap="round"/>
  <path d="M64 40 L64 216" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.85"/>
  <rect x="52" y="118" width="24" height="20" rx="8" fill="${grip}"/>
</svg>`;
}

function arrowSvg({ stroke = '#e7f0ff', tip = '#ff4d6d' } = {}) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <path d="M40 128H196" stroke="${stroke}" stroke-width="10" stroke-linecap="round"/>
  <path d="M196 128l-24-18v36z" fill="${tip}"/>
  <path d="M40 128l14-18" stroke="${stroke}" stroke-width="8" stroke-linecap="round"/>
  <path d="M40 128l14 18" stroke="${stroke}" stroke-width="8" stroke-linecap="round"/>
</svg>`;
}

function iconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="120" fill="#0b1020"/>
  <circle cx="256" cy="256" r="190" fill="#7c5cff" opacity="0.18"/>
  <g transform="translate(128 120)">
    <path d="M128 10c-90 0-124 62-124 140v142c0 16 16 28 32 22l20-8 26 16 26-16 26 16 26-16 26 16 20-8c16 6 32-6 32-22V150c0-78-34-140-124-140z" fill="#fff" stroke="#7c5cff" stroke-width="16" stroke-linejoin="round"/>
    <circle cx="88" cy="156" r="22" fill="#0b1020"/>
    <circle cx="168" cy="156" r="22" fill="#0b1020"/>
    <path d="M104 204c16 18 44 18 60 0" fill="none" stroke="#0b1020" stroke-width="14" stroke-linecap="round"/>
  </g>
</svg>`;
}

export async function loadAssets() {
  const [ghost, bow, arrow, icon] = await Promise.all([
    svgToImg(ghostSvg()),
    svgToImg(bowSvg()),
    svgToImg(arrowSvg()),
    svgToImg(iconSvg()),
  ]);

  return {
    ghost,
    bow,
    arrow,
    icon,
    // sizes for gameplay
    ghostSizes: [78, 56, 40, 30], // big -> smallest
  };
}
