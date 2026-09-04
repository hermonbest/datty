import {
  DreamHouseItemTemplate,
  DreamHousePlacedItem,
  DreamHouseRoom,
  DreamHouseLock,
} from '../../../types/games';

export const DEFAULT_GRID_SIZE = 8;
export const TILE_WIDTH = 56;
export const TILE_HEIGHT = 28;
export const LOCK_EXPIRY_MS = 30000; // Auto-expire stale locks after 30 seconds

export const FURNITURE_CATALOG: DreamHouseItemTemplate[] = [
  {
    id: 'cozy_sofa',
    name: 'Blush Velvet Sofa',
    category: 'living',
    width: 2,
    height: 1,
    color: '#e7989d',
    iconName: 'Armchair',
    description: 'A cozy 2-seater velvet sofa for quiet cuddle evenings.',
  },
  {
    id: 'love_seat',
    name: 'Cozy Armchair',
    category: 'living',
    width: 1,
    height: 1,
    color: '#f0b2b6',
    iconName: 'Armchair',
    description: 'Plush single armchair with a soft throw blanket.',
  },
  {
    id: 'coffee_table',
    name: 'Oak Coffee Table',
    category: 'living',
    width: 1,
    height: 1,
    color: '#d4a373',
    iconName: 'Coffee',
    description: 'Rustic wooden table with space for mugs and books.',
  },
  {
    id: 'record_player',
    name: 'Vintage Turntable',
    category: 'living',
    width: 1,
    height: 1,
    color: '#936639',
    iconName: 'Disc',
    description: 'Spinning your favorite shared love songs on vinyl.',
  },
  {
    id: 'double_bed',
    name: 'Cloud Double Bed',
    category: 'bedroom',
    width: 2,
    height: 2,
    color: '#dfa3a9',
    iconName: 'Bed',
    description: 'Luxurious king bed layered with feather pillows.',
  },
  {
    id: 'nightstand',
    name: 'Minimal Nightstand',
    category: 'bedroom',
    width: 1,
    height: 1,
    color: '#ddbea9',
    iconName: 'Lamp',
    description: 'Warm bedside lamp glowing with ambient light.',
  },
  {
    id: 'monstera',
    name: 'Monstera Deliciosa',
    category: 'plants',
    width: 1,
    height: 1,
    color: '#52796f',
    iconName: 'Flower2',
    description: 'Vibrant green potted plant thriving in sunlight.',
  },
  {
    id: 'ficus_tree',
    name: 'Tall Ficus Tree',
    category: 'plants',
    width: 1,
    height: 1,
    color: '#354f52',
    iconName: 'Trees',
    description: 'Indoor tree bringing calm nature into your home.',
  },
  {
    id: 'breakfast_table',
    name: 'Bistro Dining Table',
    category: 'kitchen',
    width: 2,
    height: 1,
    color: '#cb997e',
    iconName: 'UtensilsCrossed',
    description: 'Breakfast table for Sunday pancakes and hot tea.',
  },
  {
    id: 'fireplace',
    name: 'Cozy Hearth Fireplace',
    category: 'decor',
    width: 2,
    height: 1,
    color: '#b06c59',
    iconName: 'Flame',
    description: 'Crackling fire warming the room on chilly nights.',
  },
  {
    id: 'heart_rug',
    name: 'Fluffy Heart Rug',
    category: 'decor',
    width: 2,
    height: 2,
    color: '#fcdada',
    iconName: 'Heart',
    description: 'Super-soft floor rug woven with love.',
  },
  {
    id: 'fairy_lights',
    name: 'Warm Lantern',
    category: 'decor',
    width: 1,
    height: 1,
    color: '#e09f3e',
    iconName: 'Sparkles',
    description: 'Soft golden glow giving the sanctuary a dreamy mood.',
  },
];

export const CATALOG_BY_ID = FURNITURE_CATALOG.reduce<Record<string, DreamHouseItemTemplate>>(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {}
);

/**
 * Converts 2D grid coordinates (qX, qY) to 2.5D isometric screen coordinates.
 */
export function gridToScreen(
  qX: number,
  qY: number,
  originX = 0,
  originY = 0,
  tileW = TILE_WIDTH,
  tileH = TILE_HEIGHT
): { x: number; y: number } {
  const x = (qX - qY) * (tileW / 2) + originX;
  const y = (qX + qY) * (tileH / 2) + originY;
  return { x: Math.round(x), y: Math.round(y) };
}

/**
 * Converts screen coordinates to 2D grid coordinates (qX, qY).
 */
export function screenToGrid(
  screenX: number,
  screenY: number,
  originX = 0,
  originY = 0,
  tileW = TILE_WIDTH,
  tileH = TILE_HEIGHT
): { qX: number; qY: number } {
  const relX = screenX - originX;
  const relY = screenY - originY;
  const halfW = tileW / 2;
  const halfH = tileH / 2;
  const qX = Math.round((relX / halfW + relY / halfH) / 2);
  const qY = Math.round((relY / halfH - relX / halfW) / 2);
  return { qX, qY };
}

/**
 * Returns effective dimensions of an item accounting for rotation.
 */
export function getRotatedDimensions(
  template: DreamHouseItemTemplate,
  rotation = 0
): { width: number; height: number } {
  const isRotated = rotation === 90 || rotation === 270;
  return {
    width: isRotated ? template.height : template.width,
    height: isRotated ? template.width : template.height,
  };
}

/**
 * Validates whether item placement is within room grid bounds.
 */
export function isWithinGrid(
  qX: number,
  qY: number,
  itemWidth: number,
  itemHeight: number,
  gridWidth = DEFAULT_GRID_SIZE,
  gridHeight = DEFAULT_GRID_SIZE
): boolean {
  return qX >= 0 && qY >= 0 && qX + itemWidth <= gridWidth && qY + itemHeight <= gridHeight;
}

/**
 * Clamps coordinates to room grid boundary.
 */
export function clampGridCoords(
  qX: number,
  qY: number,
  itemWidth: number,
  itemHeight: number,
  gridWidth = DEFAULT_GRID_SIZE,
  gridHeight = DEFAULT_GRID_SIZE
): { qX: number; qY: number } {
  const clampedX = Math.max(0, Math.min(qX, gridWidth - itemWidth));
  const clampedY = Math.max(0, Math.min(qY, gridHeight - itemHeight));
  return { qX: clampedX, qY: clampedY };
}

/**
 * Calculates depth z-index for isometric layering.
 * Items further down/right on the grid have higher z-index (drawn on top).
 * An active dragging item gets elevated above all other items.
 */
export function calculateZIndex(qX: number, qY: number, isDragging = false): number {
  if (isDragging) {
    return 1000;
  }
  return (qX + qY) * 10 + 2;
}

/**
 * Checks whether the current user is permitted to drag an item.
 * Returns true if the item is unlocked or locked by the current user.
 */
export function canUserDragItem(
  instanceId: string,
  locks: Record<string, DreamHouseLock> | undefined,
  myUid: string | null,
  now = Date.now()
): boolean {
  if (!locks || !locks[instanceId]) {
    return true;
  }
  const lock = locks[instanceId];
  // My own lock is always movable
  if (lock.uid === myUid) {
    return true;
  }
  // If lock is older than expiry threshold, allow taking over
  if (now - lock.acquiredAt > LOCK_EXPIRY_MS) {
    return true;
  }
  return false;
}

/**
 * Generates default starter furniture for a brand new room.
 */
export function createDefaultStarterRoom(authorUid: string): DreamHouseRoom {
  const now = Date.now();
  const starterItems: DreamHousePlacedItem[] = [
    {
      instanceId: `item_${now}_1`,
      templateId: 'double_bed',
      qX: 0,
      qY: 0,
      rotation: 0,
      placedBy: authorUid,
      placedAt: now,
    },
    {
      instanceId: `item_${now}_2`,
      templateId: 'nightstand',
      qX: 2,
      qY: 0,
      rotation: 0,
      placedBy: authorUid,
      placedAt: now,
    },
    {
      instanceId: `item_${now}_3`,
      templateId: 'cozy_sofa',
      qX: 1,
      qY: 4,
      rotation: 0,
      placedBy: authorUid,
      placedAt: now,
    },
    {
      instanceId: `item_${now}_4`,
      templateId: 'coffee_table',
      qX: 1,
      qY: 5,
      rotation: 0,
      placedBy: authorUid,
      placedAt: now,
    },
    {
      instanceId: `item_${now}_5`,
      templateId: 'monstera',
      qX: 4,
      qY: 1,
      rotation: 0,
      placedBy: authorUid,
      placedAt: now,
    },
    {
      instanceId: `item_${now}_6`,
      templateId: 'heart_rug',
      qX: 4,
      qY: 4,
      rotation: 0,
      placedBy: authorUid,
      placedAt: now,
    },
  ];

  const itemsRecord: Record<string, DreamHousePlacedItem> = {};
  starterItems.forEach((it) => {
    itemsRecord[it.instanceId] = it;
  });

  return {
    layoutName: 'Our Dream Sanctuary',
    gridWidth: DEFAULT_GRID_SIZE,
    gridHeight: DEFAULT_GRID_SIZE,
    floorTheme: 'warm_wood',
    items: itemsRecord,
    updatedAt: now,
    updatedBy: authorUid,
  };
}
