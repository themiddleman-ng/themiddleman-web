#!/usr/bin/env node
function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function luminance([r, g, b]) {
  const channels = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function ratio(fg, bg) {
  const L1 = luminance(hexToRgb(fg));
  const L2 = luminance(hexToRgb(bg));
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

const dark = {
  theme: "dark",
  pairs: [
    ["bone on ink", "#F5F2EC", "#111111"],
    ["muted on ink", "#A1A1AA", "#111111"],
    ["ink on ember fill", "#111111", "#F97316"],
    ["ink on ember hover", "#111111", "#FB923C"],
    ["ember on ink", "#F97316", "#111111"],
    ["link on ink", "#FB923C", "#111111"],
    ["ember on paper", "#F97316", "#1A1A1A"],
    ["link on paper", "#FB923C", "#1A1A1A"],
    ["white on ember fill (do not use)", "#FFFFFF", "#F97316"],
  ],
};

const light = {
  theme: "light (mm-design surfaces)",
  pairs: [
    ["text on white paper", "#11172B", "#FFFFFF"],
    ["muted on white", "#536078", "#FFFFFF"],
    ["ink on ember fill", "#111111", "#F97316"],
    ["orange text on white (do not use)", "#F97316", "#FFFFFF"],
  ],
};

for (const block of [dark, light]) {
  console.log(`\n${block.theme}`);
  for (const [label, fg, bg] of block.pairs) {
    const value = ratio(fg, bg);
    console.log(`${label}: ${value.toFixed(2)}:1 (WCAG AA normal ${value >= 4.5 ? "pass" : "fail"})`);
  }
}
