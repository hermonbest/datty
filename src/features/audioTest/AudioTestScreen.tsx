import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Button, Alert, Text } from 'react-native';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
  useAudioPlayer,
} from 'expo-audio';

/**
 * Pure official Expo Audio documentation test screen.
 * Implements useAudioRecorder(RecordingPresets.HIGH_QUALITY) and useAudioPlayer
 * directly as specified in the official docs without custom audio tweaks.
 */
export function AudioTestScreen() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);

  const player = useAudioPlayer(recordedUri ? { uri: recordedUri } : null);

  const record = async () => {
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (e: any) {
      Alert.alert('Recording error', e?.message || 'Could not start');
    }
  };

  const stopRecording = async () => {
    try {
      // The recording will be available on `audioRecorder.uri`.
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      setRecordedUri(uri);
      console.log('[AudioTestScreen] Recording stopped, uri:', uri);
    } catch (e: any) {
      Alert.alert('Stop error', e?.message || 'Could not stop');
    }
  };

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission to access microphone was denied');
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Official Expo Audio Test</Text>
      <Text style={styles.subtitle}>
        RecordingPresets.HIGH_QUALITY (pure official documentation)
      </Text>

      <View style={styles.statusBox}>
        <Text style={styles.statusText}>
          Recording: {recorderState.isRecording ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.statusText}>
          Duration: {Math.round(recorderState.durationMillis / 1000)}s
        </Text>
        <Text style={styles.statusText}>
          Can Record: {recorderState.canRecord ? 'Yes' : 'No'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={recorderState.isRecording ? 'Stop recording' : 'Start recording'}
          onPress={recorderState.isRecording ? stopRecording : record}
          color={recorderState.isRecording ? '#d32f2f' : '#1976d2'}
        />
      </View>

      {recordedUri ? (
        <View style={styles.playbackContainer}>
          <Text style={styles.uriText} numberOfLines={2}>
            File: {recordedUri}
          </Text>
          <View style={styles.playButtonWrap}>
            <Button
              title="Play sound"
              onPress={() => {
                player.play();
              }}
            />
            <View style={{ height: 10 }} />
            <Button
              title="Replay sound"
              onPress={() => {
                player.seekTo(0);
                player.play();
              }}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
  },
  statusBox: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    maxWidth: 320,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  statusText: {
    fontSize: 15,
    color: '#334155',
    marginVertical: 2,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 240,
  },
  playbackContainer: {
    marginTop: 30,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  uriText: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 12,
    textAlign: 'center',
  },
  playButtonWrap: {
    width: 200,
  },
});
