import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react-native';
import { Colors, Shadows } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { lightTap, mediumTap, errorTap } from '../utils/haptics';

interface AudioRecorderProps {
  audioUri?: string;
  onAudioRecorded: (uri: string | undefined) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  audioUri,
  onAudioRecorded,
}) => {
  const { t, language } = useApp();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sound]);

  const startRecording = async () => {
    try {
      mediumTap();
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        alert(language === 'ar' ? 'يرجى السماح بصلاحية الميكروفون' : 'Microphone permission required');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      mediumTap();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      if (uri) {
        onAudioRecorded(uri);
      }
    } catch (err) {
      console.warn('Failed to stop recording', err);
    }
  };

  const playSound = async () => {
    if (!audioUri) return;
    lightTap();
    try {
      if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (err) {
      console.warn('Failed to play audio', err);
    }
  };

  const pauseSound = async () => {
    lightTap();
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const deleteRecording = async () => {
    errorTap();
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    setIsPlaying(false);
    onAudioRecorded(undefined);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.container}>
      {!audioUri ? (
        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonActive,
          ]}
        >
          {isRecording ? (
            <>
              <Square size={20} color={Colors.white} />
              <Text style={styles.recordTextWhite}>
                {t.recordingActive} ({formatSeconds(recordSeconds)})
              </Text>
            </>
          ) : (
            <>
              <Mic size={20} color={Colors.primary} />
              <Text style={styles.recordTextPrimary}>{t.recordVoice}</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.playbackContainer}>
          <TouchableOpacity
            onPress={isPlaying ? pauseSound : playSound}
            style={styles.playButton}
          >
            {isPlaying ? (
              <Pause size={18} color={Colors.white} />
            ) : (
              <Play size={18} color={Colors.white} />
            )}
          </TouchableOpacity>
          <View style={styles.waveformContainer}>
            <View style={[styles.waveBar, { height: 12 }]} />
            <View style={[styles.waveBar, { height: 20 }]} />
            <View style={[styles.waveBar, { height: 16 }]} />
            <View style={[styles.waveBar, { height: 24 }]} />
            <View style={[styles.waveBar, { height: 18 }]} />
            <View style={[styles.waveBar, { height: 10 }]} />
            <Text style={styles.audioLabel}>
              {language === 'ar' ? 'ملاحظة صوتية مسجلة' : 'Recorded Voice Note'}
            </Text>
          </View>
          <TouchableOpacity onPress={deleteRecording} style={styles.deleteButton}>
            <Trash2 size={18} color={Colors.emergency} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderStyle: 'dashed',
  },
  recordButtonActive: {
    backgroundColor: Colors.emergency,
    borderColor: Colors.emergency,
    borderStyle: 'solid',
  },
  recordTextPrimary: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  recordTextWhite: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  playbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    ...Shadows.sm,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waveBar: {
    width: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  audioLabel: {
    marginLeft: 8,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.emergencyBg,
  },
});
