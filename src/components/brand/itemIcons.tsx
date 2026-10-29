import React from 'react';
import { ItemIcon, ItemIconName } from './sidekit-icons';

// Sidekit catalog keys (snake_case) → asset-pack icon names. Keys without a matching
// drawing in the pack fall back to the pack's "package" icon.
const EXACT: Record<string, ItemIconName> = {
  drill_machine: 'drill',
  step_ladder: 'ladder',
  spirit_level: 'spirit-level',
  extension_cord: 'extension-reel',
  screws_plugs: 'anchors-screws',
  microfiber_cloth: 'cloths',
  tool_kit: 'toolbox',
  laptop_machine: 'laptop',
};

const KEYWORDS: Array<[RegExp, ItemIconName]> = [
  [/drill_?bit|masonry_bit/, 'drill-bits'],
  [/screwdriver/, 'screwdriver'],
  [/drill/, 'drill'],
  [/ladder/, 'ladder'],
  [/spirit_level|\blevel\b|_level$/, 'spirit-level'],
  [/tape_measure|measuring_tape|measure/, 'tape-measure'],
  [/goggle|safety_glass|glasses/, 'safety-glasses'],
  [/power_strip|extension_board|multi_plug/, 'power-strip'],
  [/extension|cord|reel/, 'extension-reel'],
  [/anchor|wall_plug|rawl|screw|nail/, 'anchors-screws'],
  [/hammer/, 'hammer'],
  [/allen|hex_key/, 'allen-keys'],
  [/cloth|rag|duster/, 'cloths'],
  [/bucket/, 'bucket'],
  [/laptop/, 'laptop'],
  [/camera/, 'camera'],
  [/tripod/, 'tripod'],
  [/ring_light|light/, 'ring-light'],
  [/microphone|\bmic\b/, 'microphone'],
  [/speaker/, 'speaker'],
  [/folding_table|table/, 'folding-table'],
  [/chair/, 'chair'],
  [/serving|plate|cutlery/, 'serving-set'],
  [/backdrop/, 'backdrop'],
  [/toolbox|tool_kit|toolkit/, 'toolbox'],
];

export function resolveItemIconName(itemKey?: string, title?: string): ItemIconName {
  const key = (itemKey || '').toLowerCase();
  if (EXACT[key]) return EXACT[key];
  const haystack = `${key} ${(title || '').toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
  for (const [re, name] of KEYWORDS) {
    if (re.test(haystack)) return name;
  }
  return 'package';
}

interface ItemThumbProps {
  itemKey?: string;
  title?: string;
  size?: number;
  className?: string;
}

/** Rounded tile with the brand item icon; used wherever a listing or checklist item is shown. */
export const ItemThumb: React.FC<ItemThumbProps> = ({ itemKey, title, size = 48, className = '' }) => (
  <span
    className={`inline-flex items-center justify-center shrink-0 rounded-xl border border-surface-border ${className}`}
    style={{ width: size, height: size, background: 'var(--sk-brand-50)' }}
    aria-hidden="true"
  >
    <ItemIcon name={resolveItemIconName(itemKey, title)} size={Math.round(size * 0.64)} />
  </span>
);

/** Large card header art for catalog and listing detail pages. */
export const ItemHero: React.FC<{ itemKey?: string; title?: string; className?: string; iconSize?: number }> = ({
  itemKey,
  title,
  className = '',
  iconSize = 72,
}) => (
  <div
    className={`flex items-center justify-center ${className}`}
    style={{ background: 'var(--sk-brand-50)' }}
    aria-hidden="true"
  >
    <ItemIcon name={resolveItemIconName(itemKey, title)} size={iconSize} />
  </div>
);
