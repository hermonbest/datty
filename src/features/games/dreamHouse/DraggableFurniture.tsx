import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  TouchableOpacity,
} from 'react-native';
import {
  Armchair,
  Coffee,
  Disc,
  Bed,
  Lamp,
  Flower2,
  Trees,
  UtensilsCrossed,
  Flame,
  Heart,
  Sparkles,
  RotateCw,
  Trash2,
  Lock,
} from 'lucide-react-native';
import {
  DreamHousePlacedItem,
  DreamHouseLock,
  DreamHouseLiveMove,
} from '../../../types/games';
import {
  CATALOG_BY_ID,
  gridToScreen,
  screenToGrid,
  getRotatedDimensions,
  calculateZIndex,
  clampGridCoords,
  TILE_WIDTH,
  TILE_HEIGHT,
  DEFAULT_GRID_SIZE,
} from './dreamHouseLogic';

const ICON_MAP: Record<string, any> = {
  Armchair,
  Coffee,
  Disc,
  Bed,
  Lamp,
  Flower2,
  Trees,
  UtensilsCrossed,
  Flame,
  Heart,
  Sparkles,
};

interface DraggableFurnitureProps {
  item: DreamHousePlacedItem;
  originX: number;
  originY: number;
  gridWidth?: number;
  gridHeight?: number;
  partnerLock?: DreamHouseLock;
  partnerLiveMove?: DreamHouseLiveMove;
  isSelected: boolean;
  onSelect: (instanceId: string) => void;
  onRotate: (instanceId: string) => void;
  onDelete: (instanceId: string) => void;
  onDragStart: (instanceId: string) => Promise<boolean>;
  onDragMove: (instanceId: string, qX: number, qY: number) => void;
  onCommitMove: (instanceId: string, qX: number, qY: number) => void;
  onDragEnd: (instanceId: string) => void;
}

export const DraggableFurniture: React.FC<DraggableFurnitureProps> = ({
  item,
  originX,
  originY,
  gridWidth = DEFAULT_GRID_SIZE,
  gridHeight = DEFAULT_GRID_SIZE,
  partnerLock,
  partnerLiveMove,
  isSelected,
  onSelect,
  onRotate,
  onDelete,
  onDragStart,
  onDragMove,
  onCommitMove,
  onDragEnd,
}) => {
  const template = CATALOG_BY_ID[item.templateId];
  const { width: effectiveW, height: effectiveH } = template
    ? getRotatedDimensions(template, item.rotation)
    : { width: 1, height: 1 };

  // Current display position (affected by partner's live move if being dragged remotely)
  const displayQX = partnerLiveMove ? partnerLiveMove.qX : item.qX;
  const displayQY = partnerLiveMove ? partnerLiveMove.qY : item.qY;

  const initialScreenPos = gridToScreen(
    displayQX,
    displayQY,
    originX,
    originY,
    TILE_WIDTH,
    TILE_HEIGHT
  );

  const pan = useRef(new Animated.ValueXY({ x: initialScreenPos.x, y: initialScreenPos.y })).current;
  const [isDragging, setIsDragging] = useState(false);

  // Sync pan when display coords change externally and not dragging locally
  useEffect(() => {
    if (!isDragging) {
      const nextPos = gridToScreen(
        displayQX,
        displayQY,
        originX,
        originY,
        TILE_WIDTH,
        TILE_HEIGHT
      );
      pan.setValue({ x: nextPos.x, y: nextPos.y });
    }
  }, [displayQX, displayQY, originX, originY, isDragging]);

  const isLockedByPartner = Boolean(partnerLock);
  const partnerName = partnerLock?.userName || 'Partner';

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: async () => {
        onSelect(item.instanceId);
        if (isLockedByPartner) {
          return;
        }
        const allowed = await onDragStart(item.instanceId);
        if (!allowed) {
          return;
        }
        setIsDragging(true);
        pan.setOffset({
          // @ts-ignore
          x: pan.x._value,
          // @ts-ignore
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gestureState) => {
        if (isLockedByPartner) return;
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });

        // Calculate approximate hover cell for real-time preview & RTDB sync
        // @ts-ignore
        const currentScreenX = pan.x._offset + gestureState.dx;
        // @ts-ignore
        const currentScreenY = pan.y._offset + gestureState.dy;

        const gridCoords = screenToGrid(
          currentScreenX,
          currentScreenY,
          originX,
          originY,
          TILE_WIDTH,
          TILE_HEIGHT
        );
        const clamped = clampGridCoords(
          gridCoords.qX,
          gridCoords.qY,
          effectiveW,
          effectiveH,
          gridWidth,
          gridHeight
        );
        onDragMove(item.instanceId, clamped.qX, clamped.qY);
      },
      onPanResponderRelease: () => {
        if (isLockedByPartner) return;
        pan.flattenOffset();
        setIsDragging(false);

        // @ts-ignore
        const finalScreenX = pan.x._value;
        // @ts-ignore
        const finalScreenY = pan.y._value;

        const gridCoords = screenToGrid(
          finalScreenX,
          finalScreenY,
          originX,
          originY,
          TILE_WIDTH,
          TILE_HEIGHT
        );
        const clamped = clampGridCoords(
          gridCoords.qX,
          gridCoords.qY,
          effectiveW,
          effectiveH,
          gridWidth,
          gridHeight
        );

        // Snap animation
        const snappedScreen = gridToScreen(
          clamped.qX,
          clamped.qY,
          originX,
          originY,
          TILE_WIDTH,
          TILE_HEIGHT
        );

        Animated.spring(pan, {
          toValue: { x: snappedScreen.x, y: snappedScreen.y },
          useNativeDriver: false,
          friction: 6,
        }).start();

        onCommitMove(item.instanceId, clamped.qX, clamped.qY);
        onDragEnd(item.instanceId);
      },
      onPanResponderTerminate: () => {
        pan.flattenOffset();
        setIsDragging(false);
        onDragEnd(item.instanceId);
      },
    })
  ).current;

  if (!template) return null;

  const IconComponent = ICON_MAP[template.iconName] || Armchair;
  const zIndex = calculateZIndex(displayQX, displayQY, isDragging);

  // Isometric footprint sizing
  const footprintWidth = Math.max(TILE_WIDTH, effectiveW * (TILE_WIDTH * 0.85));
  const footprintHeight = Math.max(TILE_HEIGHT + 24, effectiveH * (TILE_HEIGHT * 0.9) + 24);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
          zIndex,
          width: footprintWidth,
          height: footprintHeight,
          marginLeft: -footprintWidth / 2,
          marginTop: -footprintHeight + TILE_HEIGHT / 2,
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Selection toolbar (Rotate / Delete) */}
      {isSelected && !isLockedByPartner && !isDragging && (
        <View style={styles.toolbar}>
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() => onRotate(item.instanceId)}
            activeOpacity={0.7}
          >
            <RotateCw size={14} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toolBtn, styles.deleteBtn]}
            onPress={() => onDelete(item.instanceId)}
            activeOpacity={0.7}
          >
            <Trash2 size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Partner lock badge */}
      {isLockedByPartner && (
        <View style={styles.partnerBadge}>
          <Lock size={12} color="#ffffff" />
          <Text style={styles.partnerBadgeText} numberOfLines={1}>
            {partnerName}
          </Text>
        </View>
      )}

      {/* Isometric 3D block representation */}
      <View
        style={[
          styles.furnitureBlock,
          {
            backgroundColor: template.color,
            borderColor: isSelected ? '#a8434d' : 'rgba(255, 255, 255, 0.4)',
            borderWidth: isSelected ? 2 : 1,
            opacity: isLockedByPartner ? 0.75 : isDragging ? 0.9 : 1,
            transform: [
              { scale: isDragging ? 1.08 : 1 },
              { rotate: `${item.rotation}deg` },
            ],
          },
        ]}
      >
        <IconComponent size={20} color="#ffffff" strokeWidth={2.2} />
      </View>

      {/* Soft shadow underneath */}
      <View
        style={[
          styles.shadow,
          {
            width: footprintWidth * 0.75,
            height: TILE_HEIGHT * 0.8,
            borderRadius: footprintWidth * 0.35,
          },
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  toolbar: {
    position: 'absolute',
    top: -34,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(30, 20, 20, 0.85)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toolBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
  deleteBtn: {
    backgroundColor: '#dc2626',
  },
  partnerBadge: {
    position: 'absolute',
    top: -24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8b5cf6', // soft violet for partner activity
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  partnerBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    maxWidth: 80,
  },
  furnitureBlock: {
    width: '80%',
    height: '65%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  shadow: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    zIndex: -1,
  },
});
