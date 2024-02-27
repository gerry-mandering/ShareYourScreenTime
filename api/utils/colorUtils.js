export function getRandomPastelColor() {
  let color;
  let lightness;

  do {
    const baseLight = 210;
    const colorVariation = 45;
    const r = baseLight + Math.floor(Math.random() * colorVariation);
    const g = baseLight + Math.floor(Math.random() * colorVariation);
    const b = baseLight + Math.floor(Math.random() * colorVariation);
    color = `rgb(${r}, ${g}, ${b})`;
    lightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  } while (lightness > 240);

  return color;
}

export function getRetroToneColor() {
  const retroColors = [
    '#FFD700', // Gold
    '#FF5733', // Persimmon
    '#C04000', // Mahogany
    '#FFC0CB', // Pink
    '#800080', // Purple
    '#008080', // Teal
    '#000080', // Navy
    '#808080', // Grey
    '#008000', // Green
    '#FF0000', // Red
  ];

  const randomIndex = Math.floor(Math.random() * retroColors.length);
  return retroColors[randomIndex];
}

export function getVibrantColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 75 + Math.floor(Math.random() * 25);
  const lightness = 50 + Math.floor(Math.random() * 25);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function getMonochromeTone(baseHue, variation = 40) {
  const hueVariation = Math.floor(Math.random() * (variation * 2 + 1)) - variation;
  const adjustedHue = (baseHue + hueVariation + 360) % 360;
  const lightness = 20 + Math.floor(Math.random() * 60);
  const saturation = 50 + Math.floor(Math.random() * 50);

  return `hsl(${adjustedHue}, ${saturation}%, ${lightness}%)`;
}
