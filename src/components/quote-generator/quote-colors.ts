import type { Settings } from '@/lib/types';
import type { PaletteColors } from './types';

export function getPaletteColors(palette: Settings['colorPalette']): PaletteColors {
  const palettes: Record<string, PaletteColors> = {
    'blue-orange': {
      primary: 'rgb(37, 99, 235)',
      primaryLight: 'rgb(96, 165, 250)',
      accent: 'rgb(249, 115, 22)',
      accentLight: 'rgb(251, 146, 60)',
      background: 'rgb(255, 255, 255)',
      text: 'rgb(17, 24, 39)',
      textMuted: 'rgb(107, 114, 128)',
      border: 'rgb(229, 231, 235)',
    },
    'purple-pink': {
      primary: 'rgb(147, 51, 234)',
      primaryLight: 'rgb(192, 132, 252)',
      accent: 'rgb(236, 72, 153)',
      accentLight: 'rgb(244, 114, 182)',
      background: 'rgb(255, 255, 255)',
      text: 'rgb(17, 24, 39)',
      textMuted: 'rgb(107, 114, 128)',
      border: 'rgb(229, 231, 235)',
    },
    'green-teal': {
      primary: 'rgb(22, 163, 74)',
      primaryLight: 'rgb(74, 222, 128)',
      accent: 'rgb(20, 184, 166)',
      accentLight: 'rgb(45, 212, 191)',
      background: 'rgb(255, 255, 255)',
      text: 'rgb(17, 24, 39)',
      textMuted: 'rgb(107, 114, 128)',
      border: 'rgb(229, 231, 235)',
    },
    'red-yellow': {
      primary: 'rgb(220, 38, 38)',
      primaryLight: 'rgb(248, 113, 113)',
      accent: 'rgb(234, 179, 8)',
      accentLight: 'rgb(250, 204, 21)',
      background: 'rgb(255, 255, 255)',
      text: 'rgb(17, 24, 39)',
      textMuted: 'rgb(107, 114, 128)',
      border: 'rgb(229, 231, 235)',
    },
    'indigo-cyan': {
      primary: 'rgb(79, 70, 229)',
      primaryLight: 'rgb(129, 140, 248)',
      accent: 'rgb(6, 182, 212)',
      accentLight: 'rgb(34, 211, 238)',
      background: 'rgb(255, 255, 255)',
      text: 'rgb(17, 24, 39)',
      textMuted: 'rgb(107, 114, 128)',
      border: 'rgb(229, 231, 235)',
    },
    'slate-amber': {
      primary: 'rgb(71, 85, 105)',
      primaryLight: 'rgb(148, 163, 184)',
      accent: 'rgb(245, 158, 11)',
      accentLight: 'rgb(251, 191, 36)',
      background: 'rgb(255, 255, 255)',
      text: 'rgb(17, 24, 39)',
      textMuted: 'rgb(107, 114, 128)',
      border: 'rgb(229, 231, 235)',
    },
  };

  return palettes[palette || 'blue-orange'];
}
