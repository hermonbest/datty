import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  AppState,
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  Animated,
  PanResponder,
  Keyboard,
} from 'react-native';
import { format, isToday, isYesterday } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
  RecordingPresets,
  type AudioPlayer,
} from 'expo-audio';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { Avatar, Skeleton, EmptyState, useToast } from '../../components';
import { useCouple } from '../../services/coupleContext';
import { usePasscode } from '../../services/passcodeContext';
import { usePresence } from '../../services/usePresence';
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
  PlusCircle,
  Smile,
} from 'lucide-react-native';
import { ChatMessage, ChatReplyReference, UserProfile } from '../../types';
import { getCategoryTheme } from '../cards/categoryTheme';
import { DECKS_DATA } from '../cards/decksData';

const MAX_RECORDING_MS = 10 * 60 * 1000; // 10 minutes


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

interface VoiceNoteUIProps {
  bars: number[];
  progress: number;
  rowWidth: number;
  isMe: boolean;
  isPlaying: boolean;
  durationLabel: string;
  onToggle: () => void;
}

const renderVoiceNoteUI = ({
  bars,
  progress,
  rowWidth,
  isMe,
  isPlaying,
  durationLabel,
  onToggle,
}: VoiceNoteUIProps) => {
  const activeBarColor = isMe ? '#FFFFFF' : colors.primary;
  const inactiveBarColor = isMe ? 'rgba(255, 255, 255, 0.4)' : colors.border;
  return (
    <View style={[styles.voiceNoteRow, { width: rowWidth }]}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={[styles.voicePlayBtn, isMe ? styles.myVoicePlayBtn : styles.partnerVoicePlayBtn]}
        accessibilityLabel={isPlaying ? 'Pause voice note' : 'Play voice note'}
      >
        {isPlaying ? (
          <Pause size={15} color={isMe ? colors.primary : '#FFFFFF'} fill={isMe ? colors.primary : '#FFFFFF'} />
        ) : (
          <Play size={15} color={isMe ? '#FFFFFF' : '#FFFFFF'} fill="#FFFFFF" style={{ marginLeft: 1 }} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onToggle}
        style={styles.waveformContainer}
      >
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
      </TouchableOpacity>

      <Text style={[styles.voiceDurationText, isMe ? styles.myVoiceDuration : styles.partnerVoiceDuration]}>
        {durationLabel}
      </Text>
    </View>
  );
};

const ActiveVoiceNote: React.FC<{
  message: ChatMessage;
  isMe: boolean;
  player: AudioPlayer;
  onToggle: () => void;
}> = ({ message, isMe, player, onToggle }) => {
  const status = useAudioPlayerStatus(player);
  const bars = React.useMemo(() => getWaveformBars(message.id), [message.id]);
  const storedDuration = message.audioDuration || 0;
  const totalDuration = status.duration > 0 ? status.duration : storedDuration;
  const isFinished = !status.playing && status.currentTime >= Math.max(0, totalDuration - 0.25) && totalDuration > 0;
  const progress = isFinished ? 0 : totalDuration > 0 ? Math.min(1, Math.max(0, status.currentTime / totalDuration)) : 0;
  const rowWidth = Math.min(220, Math.max(160, (storedDuration || 30) * 2.2));

  return renderVoiceNoteUI({
    bars,
    progress,
    rowWidth,
    isMe,
    isPlaying: status.playing,
    durationLabel:
      status.playing && status.currentTime > 0
        ? formatVoiceDuration(status.currentTime)
        : formatVoiceDuration(storedDuration),
    onToggle,
  });
};

const InertVoiceNote: React.FC<{
  message: ChatMessage;
  isMe: boolean;
  onToggle: () => void;
}> = ({ message, isMe, onToggle }) => {
  const bars = React.useMemo(() => getWaveformBars(message.id), [message.id]);
  const storedDuration = message.audioDuration || 0;
  const rowWidth = Math.min(220, Math.max(160, (storedDuration || 30) * 2.2));

  return renderVoiceNoteUI({
    bars,
    progress: 0,
    rowWidth,
    isMe,
    isPlaying: false,
    durationLabel: formatVoiceDuration(storedDuration),
    onToggle,
  });
};

interface VoiceNoteRowProps {
  message: ChatMessage;
  isMe: boolean;
  isActive: boolean;
  player: AudioPlayer;
  onToggle: () => void;
}

const VoiceNoteRow: React.FC<VoiceNoteRowProps> = ({
  message,
  isMe,
  isActive,
  player,
  onToggle,
}) => {
  if (isActive) {
    return <ActiveVoiceNote message={message} isMe={isMe} player={player} onToggle={onToggle} />;
  }
  return <InertVoiceNote message={message} isMe={isMe} onToggle={onToggle} />;
};

// ---------------------------------------------------------------------------
// ChatImage — renders image preserving natural aspect ratio without cropping
// ---------------------------------------------------------------------------
interface ChatImageProps {
  uri: string;
  onPress: () => void;
}

const MAX_IMAGE_WIDTH = 240;
const MAX_IMAGE_HEIGHT = 320;

const ChatImage: React.FC<ChatImageProps> = ({ uri, onPress }) => {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Image.getSize(
      uri,
      (width, height) => {
        if (isMounted && width > 0 && height > 0) {
          const ratio = Math.max(0.5, Math.min(2.0, width / height));
          setAspectRatio(ratio);
          setLoading(false);
        }
      },
      () => {
        if (isMounted) {
          setAspectRatio(1);
          setLoading(false);
        }
      }
    );
    return () => {
      isMounted = false;
    };
  }, [uri]);

  const dimensions = React.useMemo(() => {
    if (!aspectRatio) {
      return { width: MAX_IMAGE_WIDTH, height: 200 };
    }
    if (aspectRatio >= 1) {
      // Landscape or square
      const width = MAX_IMAGE_WIDTH;
      const height = Math.min(MAX_IMAGE_HEIGHT, Math.max(120, Math.round(width / aspectRatio)));
      return { width, height };
    } else {
      // Portrait
      const height = MAX_IMAGE_HEIGHT;
      const width = Math.min(MAX_IMAGE_WIDTH, Math.max(140, Math.round(height * aspectRatio)));
      return { width, height };
    }
  }, [aspectRatio]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.bubbleImageWrapper,
        { width: dimensions.width, height: dimensions.height },
      ]}
    >
      <Image
        source={{ uri }}
        style={[styles.bubbleImage, { width: dimensions.width, height: dimensions.height }]}
        resizeMode="cover"
      />
      {loading && (
        <View style={styles.imageLoadingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------------
// SwipeableMessage — wraps a message row with swipe-right-to-reply gesture.
// Translates the bubble right up to SWIPE_THRESHOLD, then spring-bounces back.
// A reply icon fades in as the user drags.
// ---------------------------------------------------------------------------
const SWIPE_THRESHOLD = 60;
const SWIPE_MAX = 80;

interface SwipeableMessageProps {
  onReply: () => void;
  children: React.ReactNode;
}

const SwipeableMessage: React.FC<SwipeableMessageProps> = ({ onReply, children }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.5)).current;
  const triggered = useRef(false);

  const springBack = () => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(iconOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 0.5,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
    ]).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Claim gesture only on clear horizontal swipe right
        return (
          Math.abs(gestureState.dx) > 8 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5 &&
          gestureState.dx > 0
        );
      },
      onPanResponderGrant: () => {
        triggered.current = false;
        translateX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const dx = Math.max(0, Math.min(SWIPE_MAX, gestureState.dx));
        translateX.setValue(dx);
        const progress = Math.min(1, dx / SWIPE_THRESHOLD);
        iconOpacity.setValue(progress);
        iconScale.setValue(0.5 + progress * 0.5);

        if (dx >= SWIPE_THRESHOLD && !triggered.current) {
          triggered.current = true;
          // Bounce the icon on threshold hit
          Animated.sequence([
            Animated.spring(iconScale, { toValue: 1.3, useNativeDriver: true, tension: 200, friction: 5 }),
            Animated.spring(iconScale, { toValue: 1.0, useNativeDriver: true, tension: 200, friction: 5 }),
          ]).start();
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx >= SWIPE_THRESHOLD) {
          onReply();
        }
        springBack();
        triggered.current = false;
      },
      onPanResponderTerminate: () => {
        springBack();
        triggered.current = false;
      },
    })
  ).current;

  return (
    <View style={styles.swipeableWrapper}>
      {/* Reply icon revealed behind the bubble */}
      <Animated.View
        style={[
          styles.swipeReplyIcon,
          { opacity: iconOpacity, transform: [{ scale: iconScale }] },
        ]}
        pointerEvents="none"
      >
        <CornerDownRight size={18} color={colors.primary} />
      </Animated.View>

      {/* Sliding bubble */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Memoized message row — extracted from the FlatList renderItem so that typing
// in the composer or playback ticks don't re-render the whole list.
// ---------------------------------------------------------------------------
interface MessageRowProps {
  item: ChatMessage;
  isMe: boolean;
  showDateDivider: boolean;
  partnerProfile: UserProfile | null;
  onToggleReaction: (messageId: string, currentReaction?: string | null) => void;
  onOpenImage: (url: string) => void;
  onToggleAudio: (message: ChatMessage) => void;
  onReply: (item: ChatMessage) => void;
  isActive: boolean;
  player: AudioPlayer;
}

const MessageRow = React.memo<MessageRowProps>(({
  item,
  isMe,
  showDateDivider,
  partnerProfile,
  onToggleReaction,
  onOpenImage,
  onToggleAudio,
  onReply,
  isActive,
  player,
}) => {
  const hasReply = Boolean(item.replyTo);
  const reply = item.replyTo;

  // Double tap detection on bubble for heart reaction
  const lastTapRef = useRef<number>(0);
  const handleBubblePress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onToggleReaction(item.id, item.reaction);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  return (
    <View>
      {/* Date Divider */}
      {showDateDivider && (
        <View style={styles.dateDividerWrap}>
          <Text style={styles.dateDividerText}>{formatDividerDate(item.createdAt)}</Text>
        </View>
      )}

      <SwipeableMessage onReply={() => onReply(item)}>
        <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.partnerMessageRow]}>
          {!isMe && (
            <Avatar
              name={partnerProfile?.displayName || 'Partner'}
              photoURL={partnerProfile?.photoURL}
              size="sm"
              style={styles.messageAvatar}
            />
          )}

          <Pressable
            onPress={handleBubblePress}
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
                  <View style={[styles.quoteAccentBar, { backgroundColor: accentColor }]} />
                  <View style={styles.quoteBody}>
                    {reply.deckTitle ? (
                      <View style={styles.quoteDeckHeader}>
                        <Layers size={11} color={accentColor} />
                        <Text style={[styles.quoteDeckTitle, { color: accentColor }]}>
                          {replyTheme.emoji} {reply.deckTitle}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.quoteAuthorText, { color: accentColor }]}>
                        Replying to {reply.authorName || 'Answer'}
                      </Text>
                    )}

                    {reply.questionText ? (
                      <Text style={[styles.quoteQuestionText, isMe ? styles.myQuoteText : styles.partnerQuoteText]}>
                        "{reply.questionText}"
                      </Text>
                    ) : null}

                    {reply.answerText ? (
                      <Text style={[styles.quoteAnswerText, isMe ? styles.myQuoteText : styles.partnerQuoteText]}>
                        ↳ {reply.authorName ? `${reply.authorName}: ` : ''}{reply.answerText}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })()}

            {/* Image Message — auto-proportional aspect ratio, tap to fullscreen */}
            {item.imageURL ? (
              <ChatImage
                uri={item.imageURL}
                onPress={() => item.imageURL && onOpenImage(item.imageURL)}
              />
            ) : null}

            {/* Voice Note Message */}
            {item.audioURL ? (
              <VoiceNoteRow
                message={item}
                isMe={isMe}
                isActive={isActive}
                player={player}
                onToggle={() => onToggleAudio(item)}
              />
            ) : null}

            {/* Uploading / failed placeholder for non-blocking media sends */}
            {!item.imageURL && !item.audioURL && item.mediaState === 'uploading' && (
              <View style={styles.uploadingPlaceholder}>
                <ActivityIndicator size="small" color={isMe ? 'rgba(255, 255, 255, 0.8)' : colors.textMuted} />
                <Text style={[styles.uploadingText, isMe ? styles.myUploadingText : null]}>Uploading…</Text>
              </View>
            )}
            {!item.imageURL && !item.audioURL && item.mediaState === 'failed' && (
              <Text style={styles.uploadFailedText}>Upload failed</Text>
            )}

            {/* Text Message */}
            {item.text ? (
              <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.partnerMessageText]}>
                {item.text}
              </Text>
            ) : null}

            {/* Bubble Timestamp & Status */}
            <View style={styles.bubbleMeta}>
              <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.partnerMessageTime]}>
                {formatMessageTime(item.createdAt)}
              </Text>
              {item.pending && <Clock size={10} color="#FFFFFF" style={{ marginLeft: 4 }} />}
              {item.error && <AlertCircle size={10} color={colors.error} style={{ marginLeft: 4 }} />}
            </View>

            {/* Instagram-Style Heart Reaction Badge */}
            {item.reaction && (
              <TouchableOpacity
                style={styles.reactionBadge}
                activeOpacity={0.8}
                onPress={() => onToggleReaction(item.id, item.reaction)}
              >
                <Text style={styles.reactionEmoji}>{item.reaction}</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </View>
      </SwipeableMessage>
    </View>
  );
});

// Date helpers (module scope so the memoized MessageRow can use them)
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

interface RecordingBarProps {
  onCancel: () => void;
  onSend: (durationSec: number) => void;
  isStopping: boolean;
  isSending: boolean;
}

const RecordingBar: React.FC<RecordingBarProps> = React.memo(({ onCancel, onSend, isStopping, isSending }) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef(Date.now());
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.7, duration: 650, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Date.now() - startedAtRef.current;
      setElapsedMs(diff);
      if (diff >= MAX_RECORDING_MS) {
        clearInterval(interval);
        onSend(Math.floor(MAX_RECORDING_MS / 1000));
      }
    }, 250);
    return () => clearInterval(interval);
  }, [onSend]);

  const sec = Math.floor(elapsedMs / 1000);

  return (
    <>
      <View style={styles.recordingIndicator}>
        <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
        <Text style={styles.recordingTimer}>
          {formatVoiceDuration(sec)}
          <Text style={styles.recordingTimerMax}> / 10:00</Text>
        </Text>
      </View>

      <View style={styles.recordingSpacer} />

      <Pressable
        onPress={() => {
          console.log('[voice-ui] Delete / Cancel button pressed');
          onCancel();
        }}
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        accessibilityLabel="Cancel voice note"
      >
        <Trash2 size={22} color={colors.error} />
      </Pressable>

      <Pressable
        onPress={() => {
          const finalSec = Math.max(1, Math.floor((Date.now() - startedAtRef.current) / 1000));
          console.log('[voice-ui] Send voice note pressed, finalSec =', finalSec);
          onSend(finalSec);
        }}
        disabled={isStopping || isSending}
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        style={({ pressed }) => [
          styles.sendBtn,
          (isStopping || isSending) && styles.sendBtnDisabled,
          pressed && { opacity: 0.8 },
        ]}
        accessibilityLabel="Send voice note"
      >
        {isSending ? (
          <ActivityIndicator size="small" color={colors.textLight} />
        ) : (
          <Send size={17} color={colors.textLight} />
        )}
      </Pressable>
    </>
  );
});

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
  const { userProfile, partnerProfile, myUid, coupleId, partnerUid } = useCouple();
  const { messages, loading, sending, sendMessage, toggleReaction } = useChat();
  const { partnerPresence, writePresence } = usePresence(coupleId, myUid, partnerUid);

  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatReplyReference | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const toast = useToast();
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Debounced typing indicator — at most one presence write every 3s while typing,
  // cleared after 2.5s of inactivity.
  const handleChangeText = (text: string) => {
    setInputText(text);
    if (!coupleId || !myUid) return;
    if (text.trim()) {
      const now = Date.now();
      if (now - lastTypingSentRef.current > 3000) {
        lastTypingSentRef.current = now;
        writePresence({ typing: 'chat', online: true });
      }
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => writePresence({ typing: null }), 2500);
    } else {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      writePresence({ typing: null });
    }
  };

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [isStoppingRecording, setIsStoppingRecording] = useState(false);
  const startingRecordingRef = useRef(false);

  // Configure audio mode once on mount per official docs
  useEffect(() => {
    (async () => {
      const status = await requestRecordingPermissionsAsync().catch(() => null);
      if (status?.granted) {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        }).catch(() => { });
      }
    })();
  }, []);

  // Voice notes: player for message playback with reactive source
  const [activeAudio, setActiveAudio] = useState<{ id: string; url: string } | null>(null);
  const audioSource = React.useMemo(() => {
    if (!activeAudio?.url) return null;
    let uri = activeAudio.url;
    if (uri.includes('cloudinary.com') && uri.includes('/video/upload/')) {
      uri = uri.replace(/e_volume:[^/]+\//g, '');
      uri = uri.replace(/\.3gp$/i, '.m4a');
    }
    return { uri };
  }, [activeAudio?.url]);

  const player = useAudioPlayer(audioSource, { updateInterval: 150 });
  const playRequestedRef = useRef(false);

  // When activeAudio changes and play was requested, start playback once loaded
  useEffect(() => {
    if (activeAudio?.url && playRequestedRef.current) {
      try {
        player.volume = 1.0;
        player.loop = false;
        player.play();
      } catch (e: any) {
        console.warn('[voice] player.play error:', e?.message);
      }
      playRequestedRef.current = false;
    }
  }, [activeAudio?.id, player]);

  const startRecording = async () => {
    if (recorderState.isRecording || sending || startingRecordingRef.current) {
      console.log('[voice-ui] startRecording ignored: isRecording =', recorderState.isRecording, 'sending =', sending, 'starting =', startingRecordingRef.current);
      return;
    }
    startingRecordingRef.current = true;
    Keyboard.dismiss();
    console.log('[voice] startRecording: requesting mic permission');
    try {
      const permission = await requestRecordingPermissionsAsync().catch((e) => {
        console.warn('[voice] requestRecordingPermissionsAsync failed:', e?.message);
        return null;
      });
      if (!permission || !permission.granted) {
        toast.error('Microphone permission required', 'Please grant microphone access.');
        return;
      }
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      }).catch((e) => {
        console.warn('[voice] setAudioModeAsync failed:', e?.message);
      });
      console.log('[voice] preparing recorder');
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      console.log('[voice] recording started');
      setIsStoppingRecording(false);
    } catch (e: any) {
      console.warn('[voice] startRecording failed:', e?.message);
      toast.error('Could not start recording', e?.message || 'Please try again.');
    } finally {
      startingRecordingRef.current = false;
    }
  };

  const cancelRecording = useCallback(async () => {
    console.log('[voice] cancelRecording called');
    try {
      if (audioRecorder.isRecording) {
        await audioRecorder.stop();
      }
    } catch (e: any) {
      console.warn('[voice] cancelRecording error:', e?.message);
    }
    setIsStoppingRecording(false);
  }, [audioRecorder]);

  const { isLocked } = usePasscode();

  // With the passcode-as-overlay, ChatScreen stays mounted across lock trips.
  // Stop any active recording when the app backgrounds or the app locks.
  useEffect(() => {
    if (!recorderState.isRecording) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        cancelRecording();
      }
    });
    return () => sub.remove();
  }, [recorderState.isRecording, cancelRecording]);

  useEffect(() => {
    if (isLocked && recorderState.isRecording) {
      cancelRecording();
    }
  }, [isLocked, recorderState.isRecording, cancelRecording]);

  const stopAndSendRecording = useCallback(
    async (fallbackSec?: number) => {
      console.log('[voice] stopAndSendRecording called, isRecording =', recorderState.isRecording, 'isStopping =', isStoppingRecording);
      if (isStoppingRecording) return;
      setIsStoppingRecording(true);

      const rawDuration = recorderState.durationMillis || (fallbackSec ? fallbackSec * 1000 : 0);
      const durationSec = Math.min(
        MAX_RECORDING_MS / 1000,
        Math.max(1, Math.round(rawDuration / 1000))
      );

      let uri: string | null = null;
      try {
        console.log('[voice] stopAndSend: stopping, durationSec =', durationSec);
        await audioRecorder.stop();
        uri = audioRecorder.uri;
        console.log('[voice] stopAndSend: stopped, uri =', uri);
      } catch (e: any) {
        console.warn('[voice] stop failed:', e?.message);
        toast.error('Could not send voice note', e?.message || 'Recording failed.');
      }

      if (!uri) {
        console.warn('[voice] stopAndSend: no uri obtained from recorder');
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
        console.log('[voice] sending voice note message...');
        await sendMessage(undefined, undefined, replyRef, { uri, duration: durationSec });
        console.log('[voice] voice note sent successfully!');
      } catch (e: any) {
        console.error('[voice] sendMessage failed:', e?.message);
        setReplyingTo(replyRef);
        toast.error('Could not send voice note', 'Please check your connection and retry.');
      } finally {
        setIsStoppingRecording(false);
      }
    },
    [isStoppingRecording, recorderState.isRecording, recorderState.durationMillis, audioRecorder, replyingTo, sendMessage, toast]
  );

  const handleToggleAudio = useCallback(
    (message: ChatMessage) => {
      if (!message.audioURL) return;

      if (activeAudio?.id === message.id) {
        if (player.playing) {
          player.pause();
        } else {
          const curTime = player.currentTime || 0;
          const dur = player.duration || 0;
          if (dur > 0 && curTime >= dur - 0.25) {
            player.seekTo(0).catch(() => { });
          }
          player.volume = 1.0;
          player.loop = false;
          player.play();
        }
      } else {
        playRequestedRef.current = true;
        setActiveAudio({ id: message.id, url: message.audioURL });
      }
    },
    [activeAudio?.id, player]
  );

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
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    writePresence({ typing: null, online: true });

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

  const partnerTyping = partnerPresence?.typing === 'chat';
  const partnerOnline = partnerPresence ? Boolean(partnerPresence.online) : true;

  const handleReply = useCallback(
    (msg: ChatMessage) => {
      const isMe = msg.senderUid === myUid;
      setReplyingTo({
        type: 'message',
        authorName: isMe
          ? (userProfile?.displayName || 'You')
          : (partnerProfile?.displayName || 'Partner'),
        answerText: msg.text || (msg.imageURL ? '📷 Photo' : msg.audioURL ? '🎤 Voice note' : ''),
        // intentionally omit questionText + deckTitle — Firebase rejects undefined values
      });
      setTimeout(() => inputRef.current?.focus(), 200);
    },
    [myUid, userProfile?.displayName, partnerProfile?.displayName]
  );

  // Stable renderer: rows are memoized so typing / playback ticks don't
  // re-render the whole list.
  const renderMessage = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const isMe = item.senderUid === myUid;
      const nextMsg = messages[index + 1];
      const showDateDivider =
        !nextMsg || formatDividerDate(item.createdAt) !== formatDividerDate(nextMsg.createdAt);
      return (
        <MessageRow
          item={item}
          isMe={isMe}
          showDateDivider={showDateDivider}
          partnerProfile={partnerProfile}
          onToggleReaction={toggleReaction}
          onOpenImage={setViewingImage}
          onToggleAudio={handleToggleAudio}
          onReply={handleReply}
          isActive={activeAudio?.id === item.id}
          player={player}
        />
      );
    },
    [
      messages,
      myUid,
      partnerProfile,
      toggleReaction,
      handleToggleAudio,
      handleReply,
      activeAudio?.id,
      player,
    ]
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Datty Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar
            name={partnerProfile?.displayName || 'Partner'}
            photoURL={partnerProfile?.photoURL}
            size="sm"
          />
          <Text style={styles.headerTitle}>Datty</Text>
        </View>
        <TouchableOpacity style={styles.headerRightAction} activeOpacity={0.7}>
          <Heart size={24} color={colors.primary} strokeWidth={2} />
        </TouchableOpacity>
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
          extraData={{
            activeAudioId: activeAudio?.id,
          }}
          contentContainerStyle={styles.messagesList}
          renderItem={renderMessage}
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

      {/* Datty Message Composer Bar */}
      <View
        style={[styles.composerWrapper, { paddingBottom: isKeyboardVisible ? 8 : 88 }]}
        pointerEvents="box-none"
      >
        <View style={styles.composerContainer} pointerEvents="auto">
          {recorderState.isRecording ? (
            <RecordingBar
              onCancel={cancelRecording}
              onSend={stopAndSendRecording}
              isStopping={isStoppingRecording}
              isSending={sending}
            />
          ) : (
            <>
              <Pressable
                onPress={pickImage}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
              >
                <PlusCircle size={24} color={colors.textMuted} strokeWidth={1.5} />
              </Pressable>

              <TextInput
                ref={inputRef}
                style={styles.textInput}
                placeholder={replyingTo ? 'Write your reply...' : 'Message...'}
                placeholderTextColor={colors.textMuted}
                value={inputText}
                onChangeText={handleChangeText}
                multiline
                maxLength={1000}
              />

              <Pressable
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
              >
                <Smile size={24} color={colors.textMuted} strokeWidth={1.5} />
              </Pressable>

              {inputText.trim() || selectedImage ? (
                <Pressable
                  onPress={handleSend}
                  disabled={(!inputText.trim() && !selectedImage) || sending}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={({ pressed }) => [
                    styles.sendBtn,
                    (!inputText.trim() && !selectedImage) || sending ? styles.sendBtnDisabled : null,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color={colors.textLight} />
                  ) : (
                    <Send size={17} color={colors.textLight} />
                  )}
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => {
                    console.log('[voice-ui] Mic button tapped to start recording');
                    startRecording();
                  }}
                  disabled={sending}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={({ pressed }) => [
                    styles.sendBtn,
                    sending ? styles.sendBtnDisabled : null,
                    pressed && { opacity: 0.8 },
                  ]}
                  accessibilityLabel="Record voice note"
                >
                  {sending ? (
                    <ActivityIndicator size="small" color={colors.textLight} />
                  ) : (
                    <Mic size={19} color={colors.textLight} />
                  )}
                </Pressable>
              )}
            </>
          )}
        </View>
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
    paddingHorizontal: spacing.marginMobile,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255, 248, 247, 0.8)',
    borderBottomWidth: 0,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerAvatar: {
    borderWidth: 1,
    borderColor: 'rgba(217, 193, 196, 0.3)',
  },
  headerTitle: {
    fontFamily: typography.fonts.serif,
    fontSize: 24,
    color: colors.primary,
    fontWeight: typography.weights.medium,
    letterSpacing: -0.5,
  },
  headerRightAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
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
    fontSize: typography.sizes.xs,
    color: colors.secondary,
    backgroundColor: 'rgba(240, 223, 222, 0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  swipeableWrapper: {
    position: 'relative',
    overflow: 'visible',
  },
  swipeReplyIcon: {
    position: 'absolute',
    left: 4,
    top: '50%',
    marginTop: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
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
    maxWidth: '85%',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: 16,
    position: 'relative',
    ...shadows.sm,
  },
  myBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  partnerBubble: {
    backgroundColor: colors.surfaceVariant,
    borderBottomLeftRadius: 4,
    borderWidth: 0,
  },
  pendingBubble: {
    opacity: 0.75,
  },
  errorBubble: {
    borderColor: colors.error,
    borderWidth: 1,
  },
  bubbleImageWrapper: {
    borderRadius: 12,
    backgroundColor: colors.surfaceVariant,
    padding: 4,
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  bubbleImage: {
    borderRadius: 8,
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  messageText: {
    fontSize: typography.sizes.md,
    lineHeight: typography.sizes.md * typography.lineHeights.normal,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  partnerMessageText: {
    color: colors.onSurfaceVariant,
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
    padding: spacing.sm,
    marginBottom: spacing.xs + 2,
    overflow: 'hidden',
    // Fixed card-like dimensions so background is always fully visible
    minHeight: 90,
    minWidth: 220,
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
    alignSelf: 'stretch',
  },
  quoteBody: {
    flex: 1,
    justifyContent: 'space-between',
  },
  quoteDeckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
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
    flexShrink: 1,
  },
  quoteAnswerText: {
    fontSize: typography.sizes.xs - 1,
    marginTop: 4,
    flexShrink: 1,
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
  composerWrapper: {
    paddingHorizontal: spacing.marginMobile,
    paddingTop: 24,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: 'rgba(240, 223, 222, 0.6)',
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(217, 193, 196, 0.4)',
    gap: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: typography.sizes.md,
    color: colors.onSurface,
    maxHeight: 100,
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
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
  uploadingPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
  },
  uploadingText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textMuted,
  },
  myUploadingText: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  uploadFailedText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.error,
    fontStyle: 'italic',
    paddingVertical: spacing.xs,
  },
});
