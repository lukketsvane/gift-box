export interface FontMetadata {
  name: string;
  file: string;
}

export async function loadFontMetadata(): Promise<FontMetadata[]> {
  try {
    const response = await fetch('/api/fonts');
    if (!response.ok) {
      throw new Error('Failed to load font metadata');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading font metadata:', error);
    return [];
  }
}

export function getFontUrl(fontFile: string): string {
  // Encode the path segments separately to handle spaces correctly
  const segments = fontFile.split('/').map(segment => encodeURIComponent(segment))
  return `/fonts/${segments.join('/')}`
}

export function getRandomFont(fonts: FontMetadata[]): FontMetadata | null {
  if (fonts.length === 0) {
    return null;
  }
  return fonts[Math.floor(Math.random() * fonts.length)];
}

