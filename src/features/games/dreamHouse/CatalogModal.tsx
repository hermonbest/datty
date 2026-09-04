import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {
  X,
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
  Plus,
} from 'lucide-react-native';
import {
  FURNITURE_CATALOG,
} from './dreamHouseLogic';
import { DreamHouseItemCategory, DreamHouseItemTemplate } from '../../../types/games';
import { colors, radii, spacing, typography } from '../../../theme';

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

const CATEGORIES: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'living', label: 'Living' },
  { id: 'bedroom', label: 'Bedroom' },
  { id: 'plants', label: 'Plants' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'decor', label: 'Decor' },
];

interface CatalogModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectItem: (templateId: string) => void;
}

export const CatalogModal: React.FC<CatalogModalProps> = ({
  visible,
  onClose,
  onSelectItem,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredItems = FURNITURE_CATALOG.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Furniture Catalog</Text>
              <Text style={styles.subtitle}>Choose pieces for your dream sanctuary</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={20} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryBar}
          >
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryTab, active && styles.categoryTabActive]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.categoryText, active && styles.categoryTextActive]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Items Grid */}
          <ScrollView
            contentContainerStyle={styles.itemsGrid}
            showsVerticalScrollIndicator={false}
          >
            {filteredItems.map((item) => {
              const IconComp = ICON_MAP[item.iconName] || Armchair;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemCard}
                  activeOpacity={0.8}
                  onPress={() => {
                    onSelectItem(item.id);
                    onClose();
                  }}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: item.color },
                    ]}
                  >
                    <IconComp size={24} color="#ffffff" />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSize}>
                      {item.width} × {item.height} tiles • {item.category}
                    </Text>
                    {item.description ? (
                      <Text style={styles.itemDesc} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.addIconBtn}>
                    <Plus size={18} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '80%',
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  subtitle: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.full,
  },
  categoryBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryTabActive: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  categoryTextActive: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  itemsGrid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 193, 196, 0.3)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.bodyLg,
    fontWeight: '600',
    color: colors.onSurface,
  },
  itemSize: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  itemDesc: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  addIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
});
