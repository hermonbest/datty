import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { EmptyState, CardSkeleton, useToast, CachedImage } from '../../components';
import { TopAppBar } from '../../components/TopAppBar';
import { useCouple } from '../../services/coupleContext';
import { useMoments } from './useMoments';
import { NewMomentScreen } from './NewMomentScreen';
import { Plus, Camera, Heart, Trash2 } from 'lucide-react-native';
import { Moment } from '../../types';

const MomentImage: React.FC<{ uri: string }> = ({ uri }) => {
  const [imgLoading, setImgLoading] = useState(true);
  return (
    <View style={styles.imageWrapper}>
      {imgLoading && (
        <View style={styles.imageSkeletonOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
      <CachedImage
        source={{ uri }}
        style={styles.momentImage}
        resizeMode="cover"
        onLoadEnd={() => setImgLoading(false)}
      />
    </View>
  );
};

export const MomentsFeedScreen: React.FC<{ route?: any }> = ({ route }) => {
  const { userProfile, partnerProfile, myUid } = useCouple();
  const { moments, loading, deleteMoment, refreshMoments } = useMoments();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (route?.params?.action === 'snap') {
      setModalVisible(true);
    }
  }, [route?.params?.action]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshMoments();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = (moment: Moment) => {
    Alert.alert(
      'Delete Moment',
      'Are you sure you want to delete this shared moment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMoment(moment.id);
              toast.success('Deleted', 'Moment has been removed.');
            } catch (e: any) {
              toast.error('Error', 'Failed to delete moment.');
            }
          },
        },
      ]
    );
  };

  const formatCreatedAt = (createdAt: any) => {
    if (!createdAt) return 'Today';
    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      // HTML format: "EEEE, MMM dd" (e.g. Sunday, Oct 22)
      return format(date, 'EEEE, MMM dd');
    } catch (e) {
      return 'Recently';
    }
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.title}>Moments</Text>
      <Text style={styles.subtitle}>Our shared memory lane.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TopAppBar />

      {loading ? (
        <View style={[styles.loadingContainer, { paddingTop: 64 + insets.top + spacing.lg }]}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : moments.length === 0 ? (
        <View style={[styles.emptyContainer, { paddingTop: 64 + insets.top }]}>
          <EmptyState
            icon={<Camera size={32} color={colors.primary} />}
            title="No moments shared yet"
            description="Snap a picture of what you're doing right now and share your world with your partner."
            actionTitle="Post First Moment"
            onAction={() => setModalVisible(true)}
          />
        </View>
      ) : (
        <FlatList
          data={moments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.feedContent, { paddingTop: 64 + insets.top + spacing.lg }]}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => {
             const isMe = item.authorUid === myUid;
            return (
              <View style={styles.momentCard}>
                <View style={styles.imageContainer}>
                  <MomentImage uri={item.imageURL} />
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.textContainer}>
                    <Text style={styles.dateText}>{formatCreatedAt(item.createdAt)}</Text>
                    {item.caption ? (
                      <Text style={styles.captionText}>{item.caption}</Text>
                    ) : null}
                  </View>

                  <View style={styles.actionsContainer}>
                    {isMe && (
                      <TouchableOpacity
                        onPress={() => handleDelete(item)}
                        style={styles.actionBtn}
                      >
                        <Trash2 size={20} color={colors.outline} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.actionBtn}>
                      <Heart size={24} color={colors.primary} fill={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            <View style={styles.endMarker}>
              <Text style={styles.endMarkerText}>~</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity 
        style={[styles.fab, { bottom: 80 + spacing.md }]} // accounts for bottom nav
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Plus size={24} color={colors.onPrimary} />
      </TouchableOpacity>

      {/* New Moment Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <NewMomentScreen onClose={() => setModalVisible(false)} />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listHeader: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  title: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.secondary,
    marginTop: spacing.xs,
  },
  feedContent: {
    paddingHorizontal: spacing.marginMobile,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    paddingHorizontal: spacing.marginMobile,
  },
  emptyContainer: {
    paddingHorizontal: spacing.marginMobile,
    flex: 1,
    justifyContent: 'center',
  },
  momentCard: {
    marginBottom: spacing.xxl,
    flexDirection: 'column',
  },
  imageContainer: {
    width: '100%',
    borderRadius: radii.xl,
    backgroundColor: 'rgba(232, 221, 223, 0.2)', // bg-secondary-container/20
    shadowColor: colors.surfaceTint,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 2,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 4 / 5, // Editorial format
    backgroundColor: colors.surfaceVariant,
    position: 'relative',
  },
  imageSkeletonOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceVariant,
    zIndex: 1,
  },
  momentImage: {
    width: '100%',
    height: '100%',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xs,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'column',
    paddingRight: spacing.sm,
  },
  dateText: {
    ...typography.labelSm,
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  captionText: {
    ...typography.bodyLg,
    color: colors.onSurface,
    marginTop: spacing.xs,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  endMarkerText: {
    ...typography.displayLg,
    color: colors.outlineVariant,
    opacity: 0.5,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 6,
  }
});
