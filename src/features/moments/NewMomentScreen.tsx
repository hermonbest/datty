import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, radii, spacing, typography } from '../../theme';
import { Button, Input, Card, useToast } from '../../components';
import { useMoments } from './useMoments';
import { Camera, Image as ImageIcon, X, Sparkles, ArrowLeft } from 'lucide-react-native';

interface NewMomentScreenProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewMomentScreen: React.FC<NewMomentScreenProps> = ({ onClose, onSuccess }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const { createMoment, uploading } = useMoments();
  const toast = useToast();

  const pickImageFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        toast.error('Permission required', 'Please grant permission to access your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (e: any) {
      toast.error('Error selecting image', e.message);
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        toast.error('Permission required', 'Please grant permission to access your camera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (e: any) {
      toast.error('Error taking photo', e.message);
    }
  };

  const handlePost = async () => {
    if (!selectedImage) {
      toast.error('Missing Photo', 'Please select or take a photo to share.');
      return;
    }

    try {
      await createMoment(selectedImage, caption);
      toast.success('Moment Posted!', 'Shared to your timeline');
      if (onSuccess) onSuccess();
      onClose();
    } catch (e: any) {
      toast.error('Failed to post moment', e.message || 'Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Moment</Text>
        <Button
          title="Share"
          onPress={handlePost}
          loading={uploading}
          disabled={!selectedImage}
          size="sm"
          variant="primary"
          style={styles.shareBtn}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {selectedImage ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            <TouchableOpacity
              onPress={() => setSelectedImage(null)}
              style={styles.removeImageBtn}
            >
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <Card style={styles.pickerCard}>
            <View style={styles.pickerIconWrapper}>
              <Sparkles size={32} color={colors.primary} />
            </View>
            <Text style={styles.pickerTitle}>Share a moment from today</Text>
            <Text style={styles.pickerSubtitle}>
              Capture a snippet of your day for your partner to see.
            </Text>

            <View style={styles.buttonRow}>
              <Button
                title="Camera"
                onPress={takePhotoWithCamera}
                variant="secondary"
                size="md"
                leftIcon={<Camera size={18} color={colors.primary} />}
                style={styles.pickerActionBtn}
              />
              <Button
                title="Gallery"
                onPress={pickImageFromGallery}
                variant="secondary"
                size="md"
                leftIcon={<ImageIcon size={18} color={colors.primary} />}
                style={styles.pickerActionBtn}
              />
            </View>
          </Card>
        )}

        <View style={styles.captionSection}>
          <Input
            label="Caption"
            placeholder="Add a loving note or memory description..."
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={3}
            style={styles.captionInput}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  closeBtn: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  shareBtn: {
    minWidth: 70,
  },
  content: {
    padding: spacing.lg,
  },
  pickerCard: {
    alignItems: 'center',
    padding: spacing.xl,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
    borderRadius: radii.xl,
  },
  pickerIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  pickerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  pickerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    maxWidth: 260,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pickerActionBtn: {
    minWidth: 120,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  imagePreview: {
    width: '100%',
    height: 320,
    borderRadius: radii.xl,
  },
  removeImageBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionSection: {
    marginTop: spacing.lg,
  },
  captionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
