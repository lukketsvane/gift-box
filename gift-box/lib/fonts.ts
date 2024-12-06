export interface FontMetadata {
  name: string;
  file: string;
  format: string;
}

const FONT_FORMATS = ['woff', 'woff2', 'ttf'];

export async function loadFontMetadata(): Promise<FontMetadata[]> {
  const response = await fetch('/api/fonts');
  const fonts: FontMetadata[] = await response.json();
  return fonts;
}

export function getFontUrl(fontFile: string): string {
  return `/fonts/${fontFile}`;
}

export function getRandomFont(fonts: FontMetadata[]): FontMetadata {
  return fonts[Math.floor(Math.random() * fonts.length)];
}
