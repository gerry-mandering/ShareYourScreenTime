export function getRandomPastelColor() {
  let color;
  let lightness;
  do {
    const baseLight = 210; // Base lightness for pastel colors
    const colorVariation = 45; // Variation in colors
    const r = baseLight + Math.floor(Math.random() * colorVariation);
    const g = baseLight + Math.floor(Math.random() * colorVariation);
    const b = baseLight + Math.floor(Math.random() * colorVariation);
    color = `rgb(${r}, ${g}, ${b})`;
    // Calculate lightness to ensure it's not too close to white
    lightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  } while (lightness > 240); // Adjust threshold as needed
  return color;
}

export function getRetroToneColor() {
  const retroColors = [
    "#FFD700", // Gold
    "#FF5733", // Persimmon
    "#C04000", // Mahogany
    "#FFC0CB", // Pink
    "#800080", // Purple
    "#008080", // Teal
    "#000080", // Navy
    "#808080", // Grey
    "#008000", // Green
    "#FF0000", // Red
  ];
  // Randomly select a color from the list
  const randomIndex = Math.floor(Math.random() * retroColors.length);
  return retroColors[randomIndex];
}

export function getVibrantColor() {
  // Generate a color with high saturation and brightness
  const hue = Math.floor(Math.random() * 360); // Hue between 0 and 360
  const saturation = 75 + Math.floor(Math.random() * 25); // Saturation between 75% and 100%
  const lightness = 50 + Math.floor(Math.random() * 25); // Lightness between 50% and 75%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function getMonochromeTone(baseHue, variation = 40) {
  // Adjust the baseHue by a random amount within the variation range
  const hueVariation = Math.floor(Math.random() * (variation * 2 + 1)) - variation;
  const adjustedHue = (baseHue + hueVariation + 360) % 360; // Ensure hue is within 0-359
  
  const lightness = 20 + Math.floor(Math.random() * 60); // Lightness between 20% and 80%
  const saturation = 50 + Math.floor(Math.random() * 50); // Saturation between 50% and 100%
  
  return `hsl(${adjustedHue}, ${saturation}%, ${lightness}%)`;
}