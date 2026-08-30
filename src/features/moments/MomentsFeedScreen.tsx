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
import { formatDistanceToNow } from 'date-fns';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { Card, Avatar, EmptyState, CardSkeleton, useToast } from '../../components';
import { useCouple } from '../../services/coupleContext';
import { useMoments } from './useMoments';
import { NewMomentScreen } from './NewMomentScreen';
import { Plus, Camera, Trash2, Heart, Sparkles } from 'lucide-react-native';
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
      <Image
        source={{ uri }}
        style={styles.momentImage}
        resizeMode="cover"
        onLoadEnd={() => setImgLoading(false)}
      />
    </View>
  );
};

export const MomentsFeedScreen: React.FC = () => {
  const { userProfile, partnerProfile, myUid } = useCouple();
  const { moments, loading, deleteMoment, refreshMoments } = useMoments();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

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

  const getAuthor = (authorUid: string) => {
    if (authorUid === myUid) {
      return {
        name: userProfile?.displayName || 'You',
        photo: userProfile?.photoURL,
        isMe: true,
      };
    }
    return {
      name: partnerProfile?.displayName || 'Partner',
      photo: partnerProfile?.photoURL,
      isMe: false,
    };
  };

  const formatCreatedAt = (createdAt: any) => {
    if (!createdAt) return 'Just now';
    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <View style={styles.container}>
      {/* Feed Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Moments</Text>
          <Text style={styles.subtitle}>Our shared photo diary</Text>
        </View>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.addBtnHeader}
          activeOpacity={0.82}
          accessibilityLabel="Post new moment"
        >
          <Plus size={22} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Feed Body */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : moments.length === 0 ? (
        <View style={styles.emptyContainer}>
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
          contentContainerStyle={styles.feedContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => {
            const author = getAuthor(item.authorUid);
            return (
              <Card style={styles.momentCard} variant="elevated">
                {/* Author row */}
                <View style={styles.authorRow}>
                  <Avatar name={author.name} photoURL={author.photo} size="sm" highlighted={!author.isMe} />
                  <View style={styles.authorTextCol}>
                    <Text style={styles.authorName}>{author.name}</Text>
                    <Text style={styles.timeAgo}>{formatCreatedAt(item.createdAt)}</Text>
                  </View>
                  {author.isMe && (
                    <TouchableOpacity
                      onPress={() => handleDelete(item)}
                      style={styles.deleteBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Photo with smooth progressive loading */}
                <MomentImage uri={item.imageURL} />

                {/* Caption */}
                {item.caption ? (
                  <View style={styles.captionContainer}>
                    <Text style={styles.captionText}>{item.caption}</Text>
                  </View>
                ) : null}
              </Card>
            );
          }}
        />
      )}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addBtnHeader: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  feedContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    padding: spacing.lg,
  },
  emptyContainer: {
    padding: spacing.lg,
    flex: 1,
    justifyContent: 'center',
  },
  momentCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  authorTextCol: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  authorName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  timeAgo: {
    fontSize: typography.sizes.xs - 2,
    color: colors.textMuted,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  imageWrapper: {
    width: '100%',
    height: 340,
    backgroundColor: colors.cardAlt,
    position: 'relative',
  },
  imageSkeletonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardAlt,
    zIndex: 1,
  },
  momentImage: {
    width: '100%',
    height: '100%',
  },
  captionContainer: {
    padding: spacing.md,
  },
  captionText: {
    fontSize: typography.sizes.sm + 1,
    color: colors.textPrimary,
    lineHeight: (typography.sizes.sm + 1) * typography.lineHeights.normal,
  },
});
