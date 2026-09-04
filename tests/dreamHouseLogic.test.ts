import {
  gridToScreen,
  screenToGrid,
  getRotatedDimensions,
  isWithinGrid,
  clampGridCoords,
  calculateZIndex,
  canUserDragItem,
  createDefaultStarterRoom,
  FURNITURE_CATALOG,
  CATALOG_BY_ID,
  DEFAULT_GRID_SIZE,
  LOCK_EXPIRY_MS,
} from '../src/features/games/dreamHouse/dreamHouseLogic';

describe('dreamHouseLogic', () => {
  describe('Isometric Math', () => {
    it('accurately converts grid coordinates to isometric screen coordinates', () => {
      // (0, 0) -> (0, 0)
      const origin = gridToScreen(0, 0, 100, 100);
      expect(origin).toEqual({ x: 100, y: 100 });

      // Moving along qX increases both screen X and screen Y
      const stepX = gridToScreen(1, 0, 0, 0, 56, 28);
      expect(stepX).toEqual({ x: 28, y: 14 });

      // Moving along qY decreases screen X and increases screen Y
      const stepY = gridToScreen(0, 1, 0, 0, 56, 28);
      expect(stepY).toEqual({ x: -28, y: 14 });
    });

    it('performs accurate roundtrip conversion from screen to grid and back', () => {
      const tileW = 56;
      const tileH = 28;
      const originX = 150;
      const originY = 80;

      for (let qX = 0; qX < 5; qX++) {
        for (let qY = 0; qY < 5; qY++) {
          const screen = gridToScreen(qX, qY, originX, originY, tileW, tileH);
          const recovered = screenToGrid(screen.x, screen.y, originX, originY, tileW, tileH);
          expect(recovered.qX).toBe(qX);
          expect(recovered.qY).toBe(qY);
        }
      }
    });
  });

  describe('Dimensions & Rotation', () => {
    it('swaps width and height when rotated 90 or 270 degrees', () => {
      const sofa = CATALOG_BY_ID['cozy_sofa']; // 2x1
      expect(getRotatedDimensions(sofa, 0)).toEqual({ width: 2, height: 1 });
      expect(getRotatedDimensions(sofa, 90)).toEqual({ width: 1, height: 2 });
      expect(getRotatedDimensions(sofa, 180)).toEqual({ width: 2, height: 1 });
      expect(getRotatedDimensions(sofa, 270)).toEqual({ width: 1, height: 2 });
    });
  });

  describe('Grid Bounds & Clamping', () => {
    it('detects if item is within grid boundaries', () => {
      expect(isWithinGrid(0, 0, 2, 1, 8, 8)).toBe(true);
      expect(isWithinGrid(6, 7, 2, 1, 8, 8)).toBe(true);
      expect(isWithinGrid(7, 7, 2, 1, 8, 8)).toBe(false); // Out of bounds horizontally
      expect(isWithinGrid(0, 8, 1, 1, 8, 8)).toBe(false); // Out of bounds vertically
      expect(isWithinGrid(-1, 0, 1, 1, 8, 8)).toBe(false); // Negative coordinate
    });

    it('clamps coordinates safely inside the room grid', () => {
      expect(clampGridCoords(-2, 10, 2, 2, 8, 8)).toEqual({ qX: 0, qY: 6 });
      expect(clampGridCoords(3, 4, 1, 1, 8, 8)).toEqual({ qX: 3, qY: 4 });
    });
  });

  describe('Depth & Z-Index Layering', () => {
    it('assigns higher z-index to foreground items and elevates dragging item', () => {
      const backItem = calculateZIndex(1, 1, false);
      const frontItem = calculateZIndex(4, 4, false);
      expect(frontItem).toBeGreaterThan(backItem);

      const draggingItem = calculateZIndex(1, 1, true);
      expect(draggingItem).toBe(1000);
      expect(draggingItem).toBeGreaterThan(frontItem);
    });
  });

  describe('Multiplayer Concurrency & Pessimistic Locks', () => {
    const item1 = 'item_sofa_1';
    const userA = 'user_alice';
    const userB = 'user_bob';

    it('allows user to drag unlocked item', () => {
      expect(canUserDragItem(item1, undefined, userA)).toBe(true);
      expect(canUserDragItem(item1, {}, userA)).toBe(true);
    });

    it('allows user to drag item locked by themselves', () => {
      const locks = {
        [item1]: { uid: userA, acquiredAt: Date.now() },
      };
      expect(canUserDragItem(item1, locks, userA)).toBe(true);
    });

    it('prevents user from dragging item locked by partner', () => {
      const now = Date.now();
      const locks = {
        [item1]: { uid: userB, acquiredAt: now },
      };
      expect(canUserDragItem(item1, locks, userA, now)).toBe(false);
    });

    it('allows taking over lock if partner lock has expired (stale lock fallback)', () => {
      const past = Date.now() - (LOCK_EXPIRY_MS + 5000);
      const now = Date.now();
      const locks = {
        [item1]: { uid: userB, acquiredAt: past },
      };
      expect(canUserDragItem(item1, locks, userA, now)).toBe(true);
    });
  });

  describe('Starter Room Generator', () => {
    it('creates a complete default starter room with items and layout metadata', () => {
      const room = createDefaultStarterRoom('user_123');
      expect(room.layoutName).toBe('Our Dream Sanctuary');
      expect(room.gridWidth).toBe(DEFAULT_GRID_SIZE);
      expect(room.gridHeight).toBe(DEFAULT_GRID_SIZE);
      expect(room.updatedBy).toBe('user_123');

      const items = Object.values(room.items);
      expect(items.length).toBeGreaterThanOrEqual(4);
      items.forEach((item) => {
        expect(CATALOG_BY_ID[item.templateId]).toBeDefined();
        expect(item.placedBy).toBe('user_123');
      });
    });
  });
});
