/**
 * SVG Components Export
 * 
 * This file exports all SVG components for use throughout the app.
 * To add a new SVG:
 * 1. Create a new file in this directory (e.g., `logo.tsx`)
 * 2. Import and export it here
 * 
 * Usage:
 * import { LoadingIcon, Logo } from '@/lib/svgs';
 */

// Export SVG components here
export interface SvgProps {
  color?: string;
  size?: number;
  width?: number;
  height?: number;
}

// Add more exports as you create new SVG components:
// export { default as Logo } from './logo';
// export { default as IconName } from './icon-name';

export { default as EyeIcon } from './eye';
export { default as EyeSlashIcon } from './eye-slash';
