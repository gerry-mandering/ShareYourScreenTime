import fetch from 'node-fetch';
import sharp from 'sharp';
import { getMonochromeTone } from './colorUtils.js';

const SVG_CONFIG = {
  maxBarWidth: 200,
  barPaddingTop: 4,
  barHeight: 12,
  barSpacing: 30,
  iconSize: 20,
  iconPaddingTop: 5,
  textPaddingTop: 15,
  barBorderRadius: 6,
  iconBorderRadius: 4,
  headerHeight: 40,
  headerPaddingTop: 30,
  svgWidth: 320,
  borderThickness: 1,
  borderBoxRadius: 10,
};

async function getBase64Image(imgUrl) {
  if (!imgUrl) {
    throw new Error('Invalid image URL');
  }

  try {
    const response = await fetch(imgUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const buffer = await response.buffer();
    const dataURL = await sharp(buffer)
      .png()
      .toBuffer()
      .then((data) => `data:image/png;base64,${data.toString('base64')}`);
    return dataURL;
  } catch (error) {
    throw error;
  }
}

async function generateIconContent(data, base64Icons) {
  return data
    .map((item, index) => {
      const yPos = SVG_CONFIG.barSpacing * index + SVG_CONFIG.iconPaddingTop + SVG_CONFIG.headerHeight;
      const base64Icon = base64Icons[index];
      return `
        <rect x="20" y="${yPos}" width="${SVG_CONFIG.iconSize}" height="${SVG_CONFIG.iconSize}" class="iconPlaceholder"/>
        <image href="${base64Icon}" x="20" y="${yPos}" width="${SVG_CONFIG.iconSize}" height="${SVG_CONFIG.iconSize}" class="iconImage"/>
      `;
    })
    .join('');
}

function generateBarContent(data, maxUsageTime) {
  return data
    .map((item, index) => {
      const barWidth = (item.usage_time / maxUsageTime) * SVG_CONFIG.maxBarWidth;
      const yPos = SVG_CONFIG.barSpacing * index + SVG_CONFIG.iconPaddingTop + SVG_CONFIG.headerHeight;
      const barColor = getMonochromeTone(Math.floor(Math.random() * 360));
      return `
        <rect x="50" y="${yPos + SVG_CONFIG.barPaddingTop}" width="${barWidth}" height="${SVG_CONFIG.barHeight}" rx="${
        SVG_CONFIG.barBorderRadius
      }" fill="${barColor}" />
      `;
    })
    .join('');
}

function generateAppUsageContent(data) {
  return data
    .map((item, index) => {
      const yPos = SVG_CONFIG.barSpacing * index + SVG_CONFIG.iconPaddingTop + SVG_CONFIG.headerHeight;
      return `
        <text x="260" y="${yPos + SVG_CONFIG.textPaddingTop}" class="appUsage">${Math.round(
        item.usage_time / 60,
      )} min</text>
      `;
    })
    .join('');
}

export async function generateSVG(data) {
  const maxUsageTime = Math.max(...data.map((item) => item.usage_time));
  const svgHeight = data.length * SVG_CONFIG.barSpacing + SVG_CONFIG.iconPaddingTop + SVG_CONFIG.headerHeight + 5;
  const base64Icons = await Promise.all(
    data.map(async (item) => {
      try {
        return await getBase64Image(item.icon_url);
      } catch (error) {
        console.error(`Error loading image from URL ${item.icon_url}:`, error);
        return null;
      }
    }),
  );

  const iconContent = await generateIconContent(data, base64Icons);
  const barContent = generateBarContent(data, maxUsageTime);
  const appUsageContent = generateAppUsageContent(data);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${SVG_CONFIG.svgWidth}" height="${svgHeight}">
      <style>
        .borderBox { fill: none; stroke: #D3D3D3; stroke-width: ${SVG_CONFIG.borderThickness}; rx: ${ SVG_CONFIG.borderBoxRadius }; }
        .header { font: bold 16px sans-serif; fill: #505050; }
        .iconPlaceholder { fill: lightgray; rx: ${SVG_CONFIG.iconBorderRadius}px; }
        .iconImage { border-radius: ${SVG_CONFIG.iconBorderRadius}px; }
        .appUsage { font: 13px sans-serif; font-weight: 600; fill: #808080; }
      </style>
      <rect x="1" y="1" width="${SVG_CONFIG.svgWidth - 2}" height="${svgHeight - 2}" class="borderBox"/>
      <text x="20" y="${SVG_CONFIG.headerPaddingTop}" class="header">Yesterday's Screen Time</text>
      ${iconContent}
      ${barContent}
      ${appUsageContent}
    </svg>
    `;
}
