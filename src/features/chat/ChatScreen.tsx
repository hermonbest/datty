import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { format, isToday, isYesterday } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import {
  useAudioRecorder,
  useAudioRecorderState,
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
  IOSOutputFormat,
  AudioQuality,
  type RecordingOptions,
} from 'expo-audio';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { Avatar, Skeleton, EmptyState, useToast } from '../../components';
import { useCouple } from '../../services/coupleContext';
import { useChat } from './useChat';
import {
  Send,
  Image as ImageIcon,
  Camera,
  X,
  MessageCircleHeart,
  Clock,
  AlertCircle,
  CornerDownRight,
  Heart,
  Sparkles,
  Layers,
  Mic,
  Trash2,
  Play,
  Pause,
} from 'lucide-react-native';
import { ChatMessage, ChatReplyReference } from '../../types';
import { getCategoryTheme } from '../cards/categoryTheme';
import { DECKS_DATA } from '../cards/decksData';

const MAX_RECORDING_MS = 10 * 60 * 1000; // 10 minutes

const RECORDING_OPTIONS: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 44100,
  numberOfChannels: 1,
  bitRate: 64000,
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
    sampleRate: 44100,
  },
  ios: {
    extension: '.m4a',
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.HIGH,
    sampleRate: 44100,
    bitRateStrategy: 0,
    linearPCMBitDepth: 16,
  },
};

const formatVoiceDuration = (sec: number) => {
  const safe = Math.max(0, Math.floor(sec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// Deterministic pseudo-random waveform bars so each voice note looks stable across renders
const getWaveformBars = (id: string, count = 26): number[] => {
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) >>> 0;
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    bars.push(0.25 + ((seed >>> 16) % 75) / 100);
  }
  return bars;
};

interface VoiceNoteRowProps {
  message: ChatMessage;
  isMe: boolean;
  isActive: boolean;
  isPlaying: boolean;
  currentTime: number;
  playerDuration: number;
  onToggle: () => void;
}

const VoiceNoteRow: React.FC<VoiceNoteRowProps> = ({
  message,
  isMe,
  isActive,
  isPlaying,
  currentTime,
  playerDuration,
  onToggle,
}) => {
  const bars = React.useMemo(() => getWaveformBars(message.id), [message.id]);
  const storedDuration = message.audioDuration || 0;
  const totalDuration = isActive && playerDuration > 0 ? playerDuration : storedDuration;
  const progress = isActive && totalDuration > 0 ? Math.min(1, currentTime / totalDuration) : 0;
  const rowWidth = Math.min(210, Math.max(150, (storedDuration || 30) * 2.2));
  const activeBarColor = isMe ? '#FFFFFF' : colors.primary;
  const inactiveBarColor = isMe ? 'rgba(255, 255, 255, 0.4)' : colors.border;

  return (
    <View style={[styles.voiceNoteRow, { width: rowWidth }]}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.8}
        style={[styles.voicePlayBtn, isMe ? styles.myVoicePlayBtn : styles.partnerVoicePlayBtn]}
        accessibilityLabel={isPlaying ? 'Pause voice note' : 'Play voice note'}
      >
        {isPlaying ? (
          <Pause size={14} color={isMe ? colors.primary : '#FFFFFF'} fill={isMe ? colors.primary : '#FFFFFF'} />
        ) : (
          <Play size={14} color={isMe ? '#FFFFFF' : '#FFFFFF'} fill="#FFFFFF" style={{ marginLeft: 1 }} />
        )}
      </TouchableOpacity>

      <View style={styles.waveformContainer}>
        {bars.map((frac, i) => {
          const isPlayed = i / bars.length <= progress;
          return (
            <View
              key={i}
              style={[
                styles.waveformBar,
                {
                  height: 4 + frac * 18,
                  backgroundColor: isPlayed ? activeBarColor : inactiveBarColor,
                },
              ]}
            />
          );
        })}
      </View>

      <Text style={[styles.voiceDurationText, isMe ? styles.myVoiceDuration : styles.partnerVoiceDuration]}>
        {isActive && currentTime > 0 ? formatVoiceDuration(currentTime) : formatVoiceDuration(storedDuration)}
      </Text>
    </View>
  );
};

import { useNavigation } from '@react-navigation/native';

interface ChatScreenProps {
  route?: {
    params?: {
      replyTo?: ChatReplyReference;
      initialText?: string;
    };
  };
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
  const navigation = useNavigation<any>();
  const { userProfile, partnerProfile, myUid } = useCouple();
  const { messages, loading, sending, sendMessage, toggleReaction } = useChat();

  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatReplyReference | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const toast = useToast();
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Voice notes: recording
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 200);
  const [isRecording, setIsRecording] = useState(false);
  const [isStoppingRecording, setIsStoppingRecording] = useState(false);

  // Voice notes: single shared player for message playback
  const player = useAudioPlayer();
  const playerStatus = useAudioPlayerStatus(player);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);

  const recordingSec = Math.floor(recorderState.durationMillis / 1000);

  // Pulsing red dot while recording
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isRecording) {
      pulseAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.7, duration: 650, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isRecording]);

  // Reset finished playback back to start
  useEffect(() => {
    if (playerStatus.didJustFinish) {
      player.seekTo(0);
    }
  }, [playerStatus.didJustFinish]);

  // Clean up any active recording on screen unmount
  useEffect(() => {
    return () => {
      if (recorder.isRecording) {
        recorder.stop().catch(() => {});
      }
    };
  }, [recorder]);

  const startRecording = async () => {
    if (isRecording || sending) return;
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        toast.error('Microphone permission required', 'Please grant microphone access.');
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsStoppingRecording(false);
      setIsRecording(true);
    } catch (e: any) {
      setIsRecording(false);
      toast.error('Could not start recording', e?.message || 'Please try again.');
    }
  };

  const restoreAudioMode = async () => {
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
      });
    } catch (e) {
      // ignore mode restore failures
    }
  };

  const cancelRecording = async () => {
    if (!isRecording) return;
    setIsStoppingRecording(true);
    try {
      await recorder.stop();
    } catch (e) {
      // ignore stop errors on cancel
    }
    setIsRecording(false);
    setIsStoppingRecording(false);
    await restoreAudioMode();
  };

  const stopAndSendRecording = async () => {
    if (!isRecording || isStoppingRecording) return;
    setIsStoppingRecording(true);

    // Read fresh duration before stopping (polled state may lag)
    const durationSec = Math.min(
      MAX_RECORDING_MS / 1000,
      Math.max(1, Math.round(recorder.getStatus().durationMillis / 1000))
    );

    let uri: string | null = null;
    try {
      await recorder.stop();
      uri = recorder.uri;
    } catch (e: any) {
      toast.error('Could not send voice note', e?.message || 'Recording failed.');
    }
    setIsRecording(false);
    await restoreAudioMode();

    if (!uri) {
      setIsStoppingRecording(false);
      return;
    }
    if (durationSec < 1) {
      setIsStoppingRecording(false);
      toast.error('Voice note too short', 'Hold the mic a bit longer before sending.');
      return;
    }

    const replyRef = replyingTo;
    setReplyingTo(null);
    try {
      await sendMessage(undefined, undefined, replyRef, { uri, duration: durationSec });
    } catch (e: any) {
      setReplyingTo(replyRef);
      toast.error('Could not send voice note', 'Please check your connection and retry.');
    } finally {
      setIsStoppingRecording(false);
    }
  };

  // Hard stop at the 10 minute cap — auto-send
  useEffect(() => {
    if (isRecording && recorderState.durationMillis >= MAX_RECORDING_MS) {
      stopAndSendRecording();
    }
  }, [isRecording, recorderState.durationMillis]);

  const handleToggleAudio = (message: ChatMessage) => {
    if (!message.audioURL) return;
    if (activeAudioId === message.id) {
      if (playerStatus.playing) {
        player.pause();
      } else {
        if (playerStatus.didJustFinish || playerStatus.currentTime >= (playerStatus.duration || 0) - 0.2) {
          player.seekTo(0);
        }
        player.play();
      }
    } else {
      setActiveAudioId(message.id);
      player.replace({ uri: message.audioURL });
      player.play();
    }
  };

  // Set reply target from route params if navigated from Card / Daily Question
  useEffect(() => {
    if (route?.params?.replyTo) {
      setReplyingTo(route.params.replyTo);
      if (route.params.initialText) {
        setInputText(route.params.initialText);
      }
      // Clear route params so it does not persist upon tab switches
      navigation.setParams({ replyTo: undefined, initialText: undefined });
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [route?.params?.replyTo, route?.params?.initialText, navigation]);

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const text = inputText;
    const img = selectedImage;
    const replyRef = replyingTo;

    setInputText('');
    setSelectedImage(null);
    setReplyingTo(null);

    try {
      await sendMessage(text, img || undefined, replyRef);
    } catch (e: any) {
      // Restore draft and reply reference on failure
      setInputText(text);
      setSelectedImage(img);
      setReplyingTo(replyRef);
      toast.error('Could not send message', 'Draft restored. Tap send to retry.');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (e: any) {
      toast.error('Error selecting photo', e.message);
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        toast.error('Camera permission required', 'Please grant camera access.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (e: any) {
      toast.error('Error taking photo', e.message);
    }
  };

  const formatMessageTime = (createdAt: any) => {
    if (!createdAt) return '';
    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      return format(date, 'h:mm a');
    } catch (e) {
      return '';
    }
  };

  const formatDividerDate = (createdAt: any) => {
    if (!createdAt) return '';
    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'EEEE, MMMM d');
    } catch (e) {
      return '';
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Instagram-Style Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar
            name={partnerProfile?.displayName || 'Partner'}
            photoURL={partnerProfile?.photoURL}
            size="md"
            highlighted
          />
          <View style={styles.headerText}>
            <Text style={styles.partnerName}>{partnerProfile?.displayName || 'Partner'}</Text>
            <View style={styles.statusDotRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.partnerStatus}>Private Thread</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Messages Feed */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Skeleton width="60%" height={48} borderRadius={radii.xl} style={{ alignSelf: 'flex-start', marginBottom: 12 }} />
          <Skeleton width="70%" height={56} borderRadius={radii.xl} style={{ alignSelf: 'flex-end', marginBottom: 12 }} />
          <Skeleton width="50%" height={48} borderRadius={radii.xl} style={{ alignSelf: 'flex-start', marginBottom: 12 }} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={<MessageCircleHeart size={36} color={colors.primary} />}
            title="Your Private Chat"
            description="Replies from card answers and intimate notes will all appear here."
            actionTitle="Say Hello 👋"
            onAction={() => {
              setInputText('Hey my love ❤️');
            }}
          />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item, index }) => {
            const isMe = item.senderUid === myUid;
            const hasReply = Boolean(item.replyTo);
            const reply = item.replyTo;

            // Check if date divider is needed
            const nextMsg = messages[index + 1];
            const showDateDivider =
              !nextMsg ||
              formatDividerDate(item.createdAt) !== formatDividerDate(nextMsg.createdAt);

            return (
              <View>
                {/* Date Divider */}
                {showDateDivider && (
                  <View style={styles.dateDividerWrap}>
                    <Text style={styles.dateDividerText}>
                      {formatDividerDate(item.createdAt)}
                    </Text>
                  </View>
                )}

                <View
                  style={[
                    styles.messageRow,
                    isMe ? styles.myMessageRow : styles.partnerMessageRow,
                  ]}
                >
                  {!isMe && (
                    <Avatar
                      name={partnerProfile?.displayName || 'Partner'}
                      photoURL={partnerProfile?.photoURL}
                      size="sm"
                      style={styles.messageAvatar}
                    />
                  )}

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => toggleReaction(item.id, item.reaction)}
                    style={[
                      styles.bubble,
                      isMe ? styles.myBubble : styles.partnerBubble,
                      item.pending && styles.pendingBubble,
                      item.error && styles.errorBubble,
                    ]}
                  >
                    {/* Instagram-Style Quoted Reference Attachment */}
                    {hasReply && reply && (() => {
                      const matchedDeck = reply.deckTitle ? DECKS_DATA.find((d) => d.title === reply.deckTitle) : null;
                      const replyTheme = getCategoryTheme(matchedDeck?.category);
                      const accentColor = isMe ? '#FFFFFF' : replyTheme.color;

                      return (
                        <View
                          style={[
                            styles.quoteContainer,
                            isMe ? styles.myQuoteContainer : styles.partnerQuoteContainer,
                            !isMe && { borderColor: replyTheme.border, backgroundColor: replyTheme.bgLight },
                          ]}
                        >
                          <View
                            style={[
                              styles.quoteAccentBar,
                              { backgroundColor: accentColor },
                            ]}
                          />
                          <View style={styles.quoteBody}>
                            {reply.deckTitle ? (
                              <View style={styles.quoteDeckHeader}>
                                <Layers size={11} color={accentColor} />
                                <Text
                                  style={[
                                    styles.quoteDeckTitle,
                                    { color: accentColor },
                                  ]}
                                >
                                  {replyTheme.emoji} {reply.deckTitle}
                                </Text>
                              </View>
                            ) : (
                              <Text
                                style={[
                                  styles.quoteAuthorText,
                                  { color: accentColor },
                                ]}
                              >
                                Replying to {reply.authorName || 'Answer'}
                              </Text>
                            )}

                            {reply.questionText ? (
                              <Text
                                style={[
                                  styles.quoteQuestionText,
                                  isMe ? styles.myQuoteText : styles.partnerQuoteText,
                                ]}
                              >
                                "{reply.questionText}"
                              </Text>
                            ) : null}

                            {reply.answerText ? (
                              <Text
                                style={[
                                  styles.quoteAnswerText,
                                  isMe ? styles.myQuoteText : styles.partnerQuoteText,
                                ]}
                              >
                                ↳ {reply.authorName ? `${reply.authorName}: ` : ''}{reply.answerText}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      );
                    })()}

                    {/* Image Message */}
                    {item.imageURL ? (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setViewingImage(item.imageURL)}
                      >
                        <Image source={{ uri: item.imageURL }} style={styles.bubbleImage} />
                      </TouchableOpacity>
                    ) : null}

                    {/* Voice Note Message */}
                    {item.audioURL ? (
                      <VoiceNoteRow
                        message={item}
                        isMe={isMe}
                        isActive={activeAudioId === item.id}
                        isPlaying={activeAudioId === item.id && playerStatus.playing}
                        currentTime={activeAudioId === item.id ? playerStatus.currentTime : 0}
                        playerDuration={activeAudioId === item.id ? playerStatus.duration : 0}
                        onToggle={() => handleToggleAudio(item)}
                      />
                    ) : null}

                    {/* Text Message */}
                    {item.text ? (
                      <Text
                        style={[
                          styles.messageText,
                          isMe ? styles.myMessageText : styles.partnerMessageText,
                        ]}
                      >
                        {item.text}
                      </Text>
                    ) : null}

                    {/* Bubble Timestamp & Status */}
                    <View style={styles.bubbleMeta}>
                      <Text
                        style={[
                          styles.messageTime,
                          isMe ? styles.myMessageTime : styles.partnerMessageTime,
                        ]}
                      >
                        {formatMessageTime(item.createdAt)}
                      </Text>
                      {item.pending && <Clock size={10} color="#FFFFFF" style={{ marginLeft: 4 }} />}
                      {item.error && <AlertCircle size={10} color={colors.error} style={{ marginLeft: 4 }} />}
                    </View>

                    {/* Instagram-Style Heart Reaction Badge */}
                    {item.reaction && (
                      <View style={styles.reactionBadge}>
                        <Text style={styles.reactionEmoji}>{item.reaction}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Instagram-Style Active Reply Header Bar */}
      {replyingTo && (
        <View style={styles.activeReplyBar}>
          <View style={styles.activeReplyBarAccent} />
          <View style={styles.activeReplyContent}>
            <View style={styles.activeReplyHeaderRow}>
              <CornerDownRight size={13} color={colors.primary} />
              <Text style={styles.activeReplyTitle}>
                {replyingTo.deckTitle
                  ? `Replying to card from ${replyingTo.deckTitle}`
                  : `Replying to ${replyingTo.authorName || 'Partner'}`}
              </Text>
            </View>
            {replyingTo.questionText ? (
              <Text style={styles.activeReplySnippet}>
                "{replyingTo.questionText}"
              </Text>
            ) : null}
            {replyingTo.answerText ? (
              <Text style={styles.activeReplyAnswerSnippet}>
                ↳ {replyingTo.authorName ? `${replyingTo.authorName}: ` : ''}{replyingTo.answerText}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => setReplyingTo(null)}
            style={styles.cancelReplyBtn}
          >
            <X size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Selected Image Preview before sending */}
      {selectedImage && (
        <View style={styles.attachedImagePreview}>
          <View style={styles.attachedThumbnailWrap}>
            <Image source={{ uri: selectedImage }} style={styles.attachedThumbnail} />
            <TouchableOpacity
              onPress={() => setSelectedImage(null)}
              style={styles.removeAttachedBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Remove photo"
            >
              <X size={13} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Instagram-Style Message Composer Bar */}
      <View style={styles.composerContainer}>
        {isRecording ? (
          <>
            <View style={styles.recordingIndicator}>
              <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.recordingTimer}>
                {formatVoiceDuration(recordingSec)}
                <Text style={styles.recordingTimerMax}> / 10:00</Text>
              </Text>
            </View>

            <View style={styles.recordingSpacer} />

            <TouchableOpacity
              onPress={cancelRecording}
              style={styles.iconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Cancel voice note"
            >
              <Trash2 size={22} color={colors.error} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={stopAndSendRecording}
              disabled={isStoppingRecording || sending}
              style={[styles.sendBtn, isStoppingRecording || sending ? styles.sendBtnDisabled : null]}
              accessibilityLabel="Send voice note"
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.textLight} />
              ) : (
                <Send size={17} color={colors.textLight} />
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={takePhoto} style={styles.iconBtn}>
              <Camera size={22} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity onPress={pickImage} style={styles.iconBtn}>
              <ImageIcon size={22} color={colors.textSecondary} />
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder={replyingTo ? 'Write your reply...' : 'Message...'}
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />

            {inputText.trim() || selectedImage ? (
              <TouchableOpacity
                onPress={handleSend}
                disabled={(!inputText.trim() && !selectedImage) || sending}
                style={[
                  styles.sendBtn,
                  (!inputText.trim() && !selectedImage) || sending ? styles.sendBtnDisabled : null,
                ]}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={colors.textLight} />
                ) : (
                  <Send size={17} color={colors.textLight} />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={startRecording}
                disabled={sending}
                style={[styles.sendBtn, sending ? styles.sendBtnDisabled : null]}
                accessibilityLabel="Record voice note"
              >
                {sending ? (
                  <ActivityIndicator size="small" color={colors.textLight} />
                ) : (
                  <Mic size={19} color={colors.textLight} />
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Fullscreen Image Viewer Modal */}
      <Modal
        visible={!!viewingImage}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingImage(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            onPress={() => setViewingImage(null)}
            style={styles.modalCloseBtn}
          >
            <X size={24} color="#FFF" />
          </TouchableOpacity>
          {viewingImage && (
            <Image
              source={{ uri: viewingImage }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: spacing.sm + 4,
  },
  partnerName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  partnerStatus: {
    fontSize: typography.sizes.xs - 2,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  messagesList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  dateDividerWrap: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dateDividerText: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radii.full,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 3,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  partnerMessageRow: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    marginRight: spacing.xs + 2,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.xl,
    position: 'relative',
    ...shadows.sm,
  },
  myBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radii.xs,
  },
  partnerBubble: {
    backgroundColor: colors.surfaceSubtle,
    borderBottomLeftRadius: radii.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  pendingBubble: {
    opacity: 0.75,
  },
  errorBubble: {
    borderColor: colors.error,
    borderWidth: 1,
  },
  bubbleImage: {
    width: 220,
    height: 220,
    borderRadius: radii.lg,
    marginBottom: spacing.xs,
  },
  messageText: {
    fontSize: typography.sizes.sm + 0.5,
    lineHeight: (typography.sizes.sm + 0.5) * typography.lineHeights.normal,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  partnerMessageText: {
    color: colors.textPrimary,
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
  },
  messageTime: {
    fontSize: typography.sizes.xs - 3,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  partnerMessageTime: {
    color: colors.textMuted,
  },
  reactionBadge: {
    position: 'absolute',
    bottom: -8,
    right: 8,
    backgroundColor: colors.card,
    borderRadius: radii.full,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  quoteContainer: {
    flexDirection: 'row',
    borderRadius: radii.md,
    padding: spacing.xs + 2,
    marginBottom: spacing.xs + 2,
    overflow: 'hidden',
  },
  myQuoteContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  partnerQuoteContainer: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  quoteAccentBar: {
    width: 3,
    borderRadius: radii.full,
    marginRight: spacing.xs + 2,
  },
  quoteBody: {
    flex: 1,
  },
  quoteDeckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  quoteDeckTitle: {
    fontSize: typography.sizes.xs - 3,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quoteAuthorText: {
    fontSize: typography.sizes.xs - 3,
    fontWeight: typography.weights.bold,
    marginBottom: 1,
  },
  quoteQuestionText: {
    fontSize: typography.sizes.xs - 1,
    fontStyle: 'italic',
    fontWeight: typography.weights.medium,
  },
  quoteAnswerText: {
    fontSize: typography.sizes.xs - 1,
    marginTop: 2,
  },
  myQuoteText: {
    color: 'rgba(255, 255, 255, 0.95)',
  },
  partnerQuoteText: {
    color: colors.textSecondary,
  },
  activeReplyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  activeReplyBarAccent: {
    width: 3,
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    marginRight: spacing.sm,
  },
  activeReplyContent: {
    flex: 1,
  },
  activeReplyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeReplyTitle: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  activeReplySnippet: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 1,
    fontStyle: 'italic',
  },
  activeReplyAnswerSnippet: {
    fontSize: typography.sizes.xs,
    color: colors.primaryDark,
    marginTop: 2,
    fontWeight: typography.weights.medium,
  },
  cancelReplyBtn: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  attachedImagePreview: {
    padding: spacing.sm,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexDirection: 'row',
  },
  attachedThumbnailWrap: {
    position: 'relative',
    width: 60,
    height: 60,
  },
  attachedThumbnail: {
    width: 60,
    height: 60,
    borderRadius: radii.md,
  },
  removeAttachedBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 11,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.xs + 2,
  },
  iconBtn: {
    padding: spacing.xs + 2,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  sendBtnDisabled: {
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  voiceNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    marginBottom: spacing.xs,
  },
  voicePlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  myVoicePlayBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  partnerVoicePlayBtn: {
    backgroundColor: colors.primary,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    marginHorizontal: spacing.sm,
  },
  waveformBar: {
    flex: 1,
    borderRadius: 1.5,
    minWidth: 2,
  },
  voiceDurationText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.semiBold,
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
  myVoiceDuration: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  partnerVoiceDuration: {
    color: colors.textSecondary,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.xs + 2,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
  },
  recordingTimer: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  recordingTimerMax: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textMuted,
  },
  recordingSpacer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 48,
    right: 24,
    zIndex: 10,
    padding: spacing.sm,
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
});
