import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Plus,
  RotateCcw,
  Sparkles,
  Users,
} from 'lucide-react-native';
import { useDreamHouse } from './useDreamHouse';
import { IsometricGrid } from './IsometricGrid';
import { DraggableFurniture } from './DraggableFurniture';
import { CatalogModal } from './CatalogModal';
import { colors, radii, spacing, typography } from '../../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH;
const CANVAS_HEIGHT = 440;
const ORIGIN_X = CANVAS_WIDTH / 2;
const ORIGIN_Y = 130;

interface DreamHouseScreenProps {
  onBack: () => void;
  onShareToChat?: (text: string) => void;
}

export const DreamHouseScreen: React.FC<DreamHouseScreenProps> = ({
  onBack,
  onShareToChat,
}) => {
  const insets = useSafeAreaInsets();
  const {
    room,
    items,
    locks,
    liveMoves,
    loading,
    partnerName,
    isLinked,
    myUid,
    addItem,
    deleteItem,
    rotateItem,
    acquireLock,
    publishLiveMove,
    commitItemMove,
    releaseLock,
    resetRoom,
  } = useDreamHouse();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [catalogVisible, setCatalogVisible] = useState<boolean>(false);
  const [hoverCell, setHoverCell] = useState<{ qX: number; qY: number } | null>(null);

  // Check if partner is actively dragging anything in the room
  const activePartnerLocks = Object.entries(locks).filter(
    ([_, lock]) => lock && lock.uid !== myUid
  );
  const isPartnerActiveInRoom = activePartnerLocks.length > 0;

  const handleReset = () => {
    Alert.alert(
      'Reset Sanctuary?',
      'This will reset your room furniture back to the starter cozy layout. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetRoom },
      ]
    );
  };

  const handleShare = () => {
    if (onShareToChat) {
      onShareToChat(
        `🏡 Come check out our Dream Sanctuary! We have ${items.length} cozy pieces set up.`
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : spacing.md }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={colors.onSurface} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {room?.layoutName || 'Our Dream Sanctuary'}
          </Text>
          <View style={styles.presenceRow}>
            {isPartnerActiveInRoom ? (
              <>
                <View style={styles.activeDot} />
                <Text style={styles.partnerActiveText}>
                  {partnerName} is decorating now
                </Text>
              </>
            ) : (
              <>
                <Users size={12} color={colors.onSurfaceVariant} />
                <Text style={styles.presenceText}>
                  {isLinked ? `Decorating with ${partnerName}` : 'Solo / Demo Mode'}
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <RotateCcw size={18} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Canvas Area */}
      <View
        style={styles.canvasContainer}
        onTouchStart={() => setSelectedItemId(null)}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading sanctuary...</Text>
          </View>
        ) : (
          <View style={styles.canvas}>
            {/* Isometric Floor & Wall Grid */}
            <IsometricGrid
              gridWidth={room?.gridWidth}
              gridHeight={room?.gridHeight}
              originX={ORIGIN_X}
              originY={ORIGIN_Y}
              canvasWidth={CANVAS_WIDTH}
              canvasHeight={CANVAS_HEIGHT}
              highlightedCell={hoverCell}
            />

            {/* Draggable Furniture Items */}
            {items.map((item) => {
              const lock = locks[item.instanceId];
              const partnerLock = lock && lock.uid !== myUid ? lock : undefined;
              const liveMove = liveMoves[item.instanceId];
              const partnerLiveMove =
                partnerLock && liveMove && liveMove.uid !== myUid
                  ? liveMove
                  : undefined;

              return (
                <DraggableFurniture
                  key={item.instanceId}
                  item={item}
                  originX={ORIGIN_X}
                  originY={ORIGIN_Y}
                  gridWidth={room?.gridWidth}
                  gridHeight={room?.gridHeight}
                  partnerLock={partnerLock}
                  partnerLiveMove={partnerLiveMove}
                  isSelected={selectedItemId === item.instanceId}
                  onSelect={(id) => setSelectedItemId(id)}
                  onRotate={rotateItem}
                  onDelete={deleteItem}
                  onDragStart={acquireLock}
                  onDragMove={(id, qX, qY) => {
                    setHoverCell({ qX, qY });
                    publishLiveMove(id, qX, qY);
                  }}
                  onCommitMove={(id, qX, qY) => {
                    setHoverCell(null);
                    commitItemMove(id, qX, qY);
                  }}
                  onDragEnd={(id) => {
                    setHoverCell(null);
                    releaseLock(id);
                  }}
                />
              );
            })}
          </View>
        )}
      </View>

      {/* Bottom Controls Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.lg }]}>
        <View style={styles.tipBox}>
          <Sparkles size={16} color={colors.primary} />
          <Text style={styles.tipText}>
            Drag furniture to arrange. Tap for rotate and delete controls.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addFurnitureBtn}
          onPress={() => setCatalogVisible(true)}
          activeOpacity={0.85}
        >
          <Plus size={20} color={colors.onPrimary} />
          <Text style={styles.addFurnitureText}>Add Furniture</Text>
        </TouchableOpacity>
      </View>

      {/* Catalog Modal */}
      <CatalogModal
        visible={catalogVisible}
        onClose={() => setCatalogVisible(false)}
        onSelectItem={addItem}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 193, 196, 0.25)',
    zIndex: 10,
  },
  backBtn: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    ...typography.headlineMd,
    color: colors.primary,
    fontSize: 18,
  },
  presenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  presenceText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  partnerActiveText: {
    ...typography.labelSm,
    color: '#059669',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionBtn: {
    padding: spacing.sm,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.full,
  },
  canvasContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  canvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 193, 196, 0.25)',
    gap: spacing.sm,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceContainerLow,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.md,
  },
  tipText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 12,
    flex: 1,
  },
  addFurnitureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radii.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addFurnitureText: {
    ...typography.labelMd,
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
});
