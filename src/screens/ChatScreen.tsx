import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { lightTap } from '../utils/haptics';
import { CANNED_RESPONSES } from '../constants/cannedResponses';
import {
  Send,
  User,
  Stethoscope,
  Image as ImageIcon,
  Mic,
  Square,
  Play,
  Pause,
  X,
  ShieldAlert,
  Info,
  Clock,
  CheckCheck,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Colors, Shadows } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { ChatMessage } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { uploadDentalPhoto, uploadDentalAudio } from '../services/supabaseStorage';

interface ChatScreenProps {
  route?: any;
  navigation?: any;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
  const consultationId = route?.params?.consultationId || 'comp_01';
  const { messages, sendMessage, role, t, language, complaints, isRTL, currentUser, savePatientQuickProfile, refreshClinicData } = useApp();

  const [inputMessage, setInputMessage] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [previewModalUri, setPreviewModalUri] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshClinicData();
    } catch (e) {
      console.warn('ChatScreen onRefresh error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [activeAudioUri, setActiveAudioUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Patient Identification States
  const hasPatientInfo = !!(currentUser?.fullName && currentUser?.phone && currentUser.fullName !== 'مريض عيادة د. كريم' && currentUser.phone.replace(/[^0-9]/g, '').length >= 8);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [patientNameInput, setPatientNameInput] = useState(currentUser?.fullName || '');
  const [patientPhoneInput, setPatientPhoneInput] = useState(currentUser?.phone || '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const flatListRef = useRef<FlashList<ChatMessage>>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const linkedComplaint = complaints.find((c) => c.id === consultationId);

  // Filter messages for this consultation or show all if general
  const consultationMessages = messages.filter((m) =>
    consultationId ? m.consultationId === consultationId : true
  );

  // Realtime Postgres Subscription for Instant Messaging
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel(`realtime:messages:${consultationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `consultation_id=eq.${consultationId}`,
        },
        (payload) => {
          const newRow = payload.new as any;
          if (newRow && !messages.some((m) => m.id === newRow.id)) {
            // Optimistically update
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [consultationId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages.length]);

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

  const checkPatientProfileBeforeAction = (): boolean => {
    if (role === 'doctor') return true;
    if (!hasPatientInfo) {
      setShowProfileModal(true);
      return false;
    }
    return true;
  };

  const handleSaveProfileAndContinue = async () => {
    let isValid = true;
    const cleanName = patientNameInput.trim();
    const cleanPhone = patientPhoneInput.trim();
    const phoneDigits = cleanPhone.replace(/[^0-9]/g, '');

    if (!cleanName || cleanName.length < 2) {
      setNameError(
        language === 'ar'
          ? 'يرجى كتابة الاسم بالكامل بشكل صحيح (حرفين على الأقل)'
          : 'Please enter your full name (at least 2 characters)'
      );
      isValid = false;
    } else {
      setNameError(null);
    }

    if (!cleanPhone || phoneDigits.length < 8) {
      setPhoneError(
        language === 'ar'
          ? 'يرجى إدخال رقم هاتف صحيح لا يقل عن 8 أرقام (مثال: 01012345678)'
          : 'Please enter a valid phone number with at least 8 digits'
      );
      isValid = false;
    } else {
      setPhoneError(null);
    }

    if (!isValid) return;

    try {
      await savePatientQuickProfile(cleanName, cleanPhone);
      setShowProfileModal(false);
    } catch (err: any) {
      console.error('[ChatScreen] Error saving patient quick profile:', err);
      Alert.alert(
        language === 'ar' ? 'تعذر حفظ البيانات' : 'Save Error',
        err?.message || (language === 'ar' ? 'يرجى المحاولة مرة أخرى' : 'Please try again')
      );
    }
  };

  // Handle Pick Image
  const handlePickImage = async () => {
    if (!checkPatientProfileBeforeAction()) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          language === 'ar' ? 'تنبيه' : 'Permission needed',
          language === 'ar'
            ? 'يرجى إعطاء صلاحية الوصول للصور لإرفاق صور الأسنان'
            : 'Photo library access is needed to attach images'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Error picking image:', e);
    }
  };

  // Handle Voice Recording
  const startVoiceRecording = async () => {
    if (!checkPatientProfileBeforeAction()) return;
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          language === 'ar' ? 'تنبيه' : 'Permission needed',
          language === 'ar'
            ? 'يرجى إعطاء صلاحية الميكروفون لتسجيل الرسائل الصوتية'
            : 'Microphone permission is required for voice notes'
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Failed to start recording', err);
    }
  };

  const stopAndSendVoiceRecording = async () => {
    if (!recording) return;
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      setRecordSeconds(0);

      if (uri) {
        setIsSending(true);
        const cloudAudioUri = await uploadDentalAudio(uri, role);
        await sendMessage(
          consultationId,
          language === 'ar' ? '🎤 تسجيل صوتي' : '🎤 Voice Note',
          cloudAudioUri,
          undefined
        );
        setIsSending(false);
      }
    } catch (err) {
      console.warn('Failed to stop and send recording', err);
      setIsRecording(false);
    }
  };

  const cancelVoiceRecording = async () => {
    if (!recording) return;
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      await recording.stopAndUnloadAsync();
      setRecording(null);
      setIsRecording(false);
      setRecordSeconds(0);
    } catch (e) {
      console.warn('Cancel recording error:', e);
    }
  };

  // Play audio note
  const handleToggleAudio = async (audioUri: string) => {
    try {
      if (activeAudioUri === audioUri && isPlayingAudio && sound) {
        await sound.pauseAsync();
        setIsPlayingAudio(false);
        return;
      }

      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setActiveAudioUri(audioUri);
      setIsPlayingAudio(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingAudio(false);
          setActiveAudioUri(null);
        }
      });
    } catch (err) {
      console.warn('Error playing audio note:', err);
    }
  };

  // Send Text / Image Message
  const handleSend = async () => {
    if (!checkPatientProfileBeforeAction()) return;
    if (!inputMessage.trim() && !selectedImageUri) return;
    setIsSending(true);
    const textToSend = inputMessage.trim();
    let imageToSend: string | undefined = undefined;

    try {
      lightTap();
      if (selectedImageUri) {
        imageToSend = await uploadDentalPhoto(selectedImageUri, role);
      }

      setInputMessage('');
      setSelectedImageUri(null);

      await sendMessage(consultationId, textToSend, undefined, imageToSend);
    } catch (err: any) {
      console.error('[ChatScreen] handleSend error:', err);
      Alert.alert(
        language === 'ar' ? 'تعذر إرسال الرسالة' : 'Send Error',
        err?.message || (language === 'ar' ? 'يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى' : 'Please check connection and retry')
      );
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    const isMe =
      (role === 'doctor' && item.senderRole === 'doctor') ||
      (role === 'patient' && item.senderRole === 'patient');

    const hasAudio = !!item.audioUri;
    const hasImage = !!item.imageUri;

    return (
      <View
        style={[
          styles.messageRow,
          isMe ? styles.messageRowMe : styles.messageRowOther,
        ]}
      >
        {!isMe && (
          item.senderRole === 'doctor' ? (
            <Image
              source={require('../../assets/doctor_clinic.jpg')}
              style={styles.chatDoctorAvatarImg}
            />
          ) : (
            <View style={[styles.avatarIcon, { backgroundColor: Colors.secondary }]}>
              <User size={15} color={Colors.white} />
            </View>
          )
        )}

        <View
          style={[
            styles.messageBubble,
            isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
          ]}
        >
          <Text
            style={[
              styles.senderNameText,
              isMe ? styles.senderNameMe : styles.senderNameOther,
            ]}
          >
            {item.senderName}
          </Text>

          {/* Attached Image */}
          {hasImage && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setPreviewModalUri(item.imageUri || null)}
              style={styles.imageBubbleContainer}
            >
              <Image
                source={{ uri: item.imageUri }}
                style={styles.messageImage}
                contentFit="cover"
              />
            </TouchableOpacity>
          )}

          {/* Attached Voice Note */}
          {hasAudio && (
            <View style={styles.voiceNoteRow}>
              <TouchableOpacity
                onPress={() => handleToggleAudio(item.audioUri!)}
                style={[
                  styles.audioPlayBtn,
                  isMe ? styles.audioPlayBtnMe : styles.audioPlayBtnOther,
                ]}
              >
                {activeAudioUri === item.audioUri && isPlayingAudio ? (
                  <Pause size={16} color={isMe ? Colors.primary : Colors.white} />
                ) : (
                  <Play size={16} color={isMe ? Colors.primary : Colors.white} />
                )}
              </TouchableOpacity>
              <View style={styles.audioWaveform}>
                <View
                  style={[
                    styles.audioBar,
                    { height: 10, backgroundColor: isMe ? Colors.white : Colors.primary },
                  ]}
                />
                <View
                  style={[
                    styles.audioBar,
                    { height: 18, backgroundColor: isMe ? Colors.white : Colors.primary },
                  ]}
                />
                <View
                  style={[
                    styles.audioBar,
                    { height: 14, backgroundColor: isMe ? Colors.white : Colors.primary },
                  ]}
                />
                <View
                  style={[
                    styles.audioBar,
                    { height: 22, backgroundColor: isMe ? Colors.white : Colors.primary },
                  ]}
                />
                <View
                  style={[
                    styles.audioBar,
                    { height: 12, backgroundColor: isMe ? Colors.white : Colors.primary },
                  ]}
                />
                <Text
                  style={[
                    styles.voiceNoteLabel,
                    isMe ? { color: Colors.white } : { color: Colors.textSecondary },
                  ]}
                >
                  {t.voiceMessage}
                </Text>
              </View>
            </View>
          )}

          {/* Text Message */}
          {!!item.text && (
            <Text
              style={[
                styles.messageText,
                isMe ? styles.messageTextMe : styles.messageTextOther,
              ]}
            >
              {item.text}
            </Text>
          )}

          {/* Footer with Timestamp & Checkmark */}
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.timestampText,
                isMe ? styles.timestampMe : styles.timestampOther,
              ]}
            >
              {new Date(item.timestamp).toLocaleTimeString(
                language === 'ar' ? 'ar-EG' : 'en-US',
                {
                  hour: '2-digit',
                  minute: '2-digit',
                }
              )}
            </Text>
            {isMe && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 4 }}>
                {item.status === 'sending' && <Text style={{ fontSize: 10 }}>⏳</Text>}
                {item.status === 'sent' && <Text style={{ fontSize: 10 }}>✔️✔️</Text>}
                {item.status === 'failed' && (
                  <TouchableOpacity onPress={() => {/* Handle retry later if needed */}} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 10 }}>❌ </Text>
                    <Text style={{ fontSize: 10, color: 'white', textDecorationLine: 'underline' }}>Retry</Text>
                  </TouchableOpacity>
                )}
                {(!item.status || (item.status !== 'sending' && item.status !== 'sent' && item.status !== 'failed')) && (
                  <CheckCheck size={12} color="rgba(255,255,255,0.75)" />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }, [role, language, t, activeAudioUri, isPlayingAudio]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header Context Card */}
      <View style={styles.headerContextCard}>
        <View style={styles.headerPartnerRow}>
          {role === 'patient' && (
            <Image
              source={require('../../assets/doctor_clinic.jpg')}
              style={styles.chatHeaderAvatar}
            />
          )}
          <View style={styles.partnerInfo}>
            <View style={styles.partnerNameRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.partnerName}>
                {role === 'doctor'
                  ? linkedComplaint?.patientName || t.patientOnlineBadge
                  : t.doctorOnlineBadge}
              </Text>
            </View>
            <Text style={styles.partnerSub}>
              {linkedComplaint
                ? `${t.caseAttached}: #${linkedComplaint.selectedTeeth.join(', #')} (${
                    linkedComplaint.description.slice(0, 32)
                  }...)`
                : t.onlineNow}
            </Text>
          </View>

          {linkedComplaint && (
            <View
              style={[
                styles.urgencyBadge,
                linkedComplaint.urgencyLevel === 'urgent'
                  ? { backgroundColor: Colors.emergencyBg }
                  : { backgroundColor: Colors.urgentBg },
              ]}
            >
              <Text
                style={[
                  styles.urgencyBadgeText,
                  linkedComplaint.urgencyLevel === 'urgent'
                    ? { color: Colors.emergency }
                    : { color: Colors.urgent },
                ]}
              >
                {linkedComplaint.urgencyLevel === 'urgent'
                  ? t.urgencyUrgent
                  : t.urgencyModerate}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Unidentified Patient Top Banner */}
      {role === 'patient' && !hasPatientInfo && (
        <TouchableOpacity
          onPress={() => setShowProfileModal(true)}
          style={{
            backgroundColor: '#eff6ff',
            borderBottomWidth: 1,
            borderBottomColor: '#93c5fd',
            padding: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <Info size={18} color="#0284c7" />
            <Text style={{ fontSize: 12, color: '#0369a1', fontWeight: '700', flex: 1 }}>
              {language === 'ar'
                ? 'يرجى تسجيل اسمك ورقم هاتفك أولاً لتتمكن من إرسال الرسائل للطبيب'
                : 'Please enter your name and phone number to start chatting'}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: '#0284c7', fontWeight: '900' }}>
            {language === 'ar' ? 'تسجيل ✍️' : 'Register ✍️'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Messages List */}
      <FlashList
        ref={flatListRef}
        data={consultationMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyMessagesBox}>
            <Stethoscope size={40} color={Colors.primary} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyMessagesTitle}>
              {language === 'ar' ? 'ابدأ المحادثة مع الطبيب الآن' : 'Start your consultation with the doctor'}
            </Text>
            <Text style={styles.emptyMessagesText}>
              {language === 'ar'
                ? 'يمكنك إرسال استفساراتك، صور الأسنان أو الأشعة، والتسجيلات الصوتية مباشرة.'
                : 'Send questions, dental X-rays, or voice notes directly.'}
            </Text>
          </View>
        }
      />

      {/* Selected Image Thumbnail Preview Bar */}
      {selectedImageUri && (
        <View style={styles.previewBar}>
          <Image source={{ uri: selectedImageUri }} style={styles.thumbImage} />
          <View style={styles.thumbTextContainer}>
            <Text style={styles.thumbTitle}>{t.photoMessage}</Text>
            <Text style={styles.thumbSub}>جاهز للإرسال مع رسالتك</Text>
          </View>
          <TouchableOpacity
            onPress={() => setSelectedImageUri(null)}
            style={styles.closeThumbBtn}
          >
            <X size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Voice Recording Active Bar */}
      {isRecording && (
        <View style={styles.recordingBar}>
          <View style={styles.recordingIndicator}>
            <View style={styles.redPulseDot} />
            <Text style={styles.recordingTimer}>
              00:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds}
            </Text>
          </View>
          <Text style={styles.recordingHint}>
            {language === 'ar'
              ? 'جاري تسجيل رسالتك الصوتية...'
              : 'Recording voice message...'}
          </Text>
          <View style={styles.recordingActions}>
            <TouchableOpacity
              onPress={cancelVoiceRecording}
              style={styles.cancelRecordBtn}
            >
              <Text style={styles.cancelRecordText}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={stopAndSendVoiceRecording}
              style={styles.sendRecordBtn}
            >
              <Square size={14} color={Colors.white} />
              <Text style={styles.sendRecordText}>
                {language === 'ar' ? 'إرسال' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Canned Responses for Doctor */}
      {role === 'doctor' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ maxHeight: 40, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface }}
          contentContainerStyle={{ paddingHorizontal: 10, alignItems: 'center' }}
        >
          {CANNED_RESPONSES.map((res, idx) => {
            const text = language === 'ar' ? res.textAr : res.textEn;
            const title = language === 'ar' ? res.titleAr : res.titleEn;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => setInputMessage(text)}
                style={{
                  backgroundColor: Colors.primaryLight,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  marginRight: 8,
                }}
              >
                <Text style={{ fontSize: 12, color: Colors.primaryDark, fontWeight: '600' }}>{title}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Bottom Input Action Bar */}
      <View style={styles.inputContainer}>
        {/* Attach Photo Button */}
        <TouchableOpacity
          style={styles.attachBtn}
          onPress={handlePickImage}
          disabled={isRecording || isSending}
        >
          <ImageIcon size={20} color={Colors.primary} />
        </TouchableOpacity>

        {/* Record Voice Note Button */}
        <TouchableOpacity
          style={[styles.attachBtn, isRecording && { backgroundColor: Colors.emergencyBg }]}
          onPress={isRecording ? stopAndSendVoiceRecording : startVoiceRecording}
          disabled={isSending}
        >
          <Mic size={20} color={isRecording ? Colors.emergency : Colors.primary} />
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          style={styles.input}
          placeholder={t.typeMessagePlaceholder}
          placeholderTextColor={Colors.textMuted}
          value={inputMessage}
          onChangeText={setInputMessage}
          textAlign={language === 'ar' ? 'right' : 'left'}
          multiline
          maxLength={500}
          editable={!isRecording}
        />

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!inputMessage.trim() && !selectedImageUri) || isSending
              ? styles.sendBtnDisabled
              : null,
          ]}
          onPress={handleSend}
          disabled={(!inputMessage.trim() && !selectedImageUri) || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Send
              size={18}
              color={Colors.white}
              style={{
                transform: [{ rotate: isRTL ? '180deg' : '0deg' }],
              }}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Patient Identification Modal */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 22, ...Shadows.lg }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 6 }}>
              {language === 'ar' ? '👋 مرحباً بك في المحادثة المباشرة' : '👋 Welcome to Direct Chat'}
            </Text>
            <Text style={{ fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginBottom: 16, lineHeight: 18 }}>
              {language === 'ar'
                ? 'يرجى إدخال اسمك ورقم هاتفك أولاً لتتمكن من مراسلة د. كريم ومتابعة حالتك الطبية:'
                : 'Please enter your name and phone number to message Dr. Karim:'}
            </Text>

            <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4, textAlign: language === 'ar' ? 'right' : 'left' }}>
              {language === 'ar' ? 'الاسم بالكامل:' : 'Full Name:'}
            </Text>
            <TextInput
              style={{
                backgroundColor: '#f8fafc',
                borderWidth: 1,
                borderColor: nameError ? Colors.emergency : '#cbd5e1',
                borderRadius: 12,
                padding: 12,
                fontSize: 13,
                marginBottom: nameError ? 4 : 12,
                textAlign: language === 'ar' ? 'right' : 'left',
              }}
              placeholder={language === 'ar' ? 'مثال: محمد أحمد' : 'e.g. John Doe'}
              value={patientNameInput}
              onChangeText={(txt) => {
                setPatientNameInput(txt);
                if (nameError) setNameError(null);
              }}
            />
            {nameError && (
              <Text style={{ fontSize: 11, color: Colors.emergency, fontWeight: '700', marginBottom: 10, textAlign: language === 'ar' ? 'right' : 'left' }}>
                ⚠️ {nameError}
              </Text>
            )}

            <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4, textAlign: language === 'ar' ? 'right' : 'left' }}>
              {language === 'ar' ? 'رقم الهاتف / الواتساب:' : 'Phone / WhatsApp:'}
            </Text>
            <TextInput
              style={{
                backgroundColor: '#f8fafc',
                borderWidth: 1,
                borderColor: phoneError ? Colors.emergency : '#cbd5e1',
                borderRadius: 12,
                padding: 12,
                fontSize: 13,
                marginBottom: phoneError ? 4 : 18,
                textAlign: language === 'ar' ? 'right' : 'left',
              }}
              placeholder="+20 100 000 0000"
              keyboardType="phone-pad"
              value={patientPhoneInput}
              onChangeText={(txt) => {
                setPatientPhoneInput(txt);
                if (phoneError) setPhoneError(null);
              }}
            />
            {phoneError && (
              <Text style={{ fontSize: 11, color: Colors.emergency, fontWeight: '700', marginBottom: 14, textAlign: language === 'ar' ? 'right' : 'left' }}>
                ⚠️ {phoneError}
              </Text>
            )}

            <TouchableOpacity
              onPress={handleSaveProfileAndContinue}
              style={{ backgroundColor: Colors.primary, padding: 14, borderRadius: 14, alignItems: 'center' }}
            >
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 13 }}>
                {language === 'ar' ? 'حفظ وبدء المحادثة المباشرة 💬' : 'Save & Start Chatting 💬'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Full-Screen Image Preview Modal */}
      <Modal
        visible={!!previewModalUri}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewModalUri(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setPreviewModalUri(null)}
          >
            <X size={24} color={Colors.white} />
          </TouchableOpacity>
          {previewModalUri && (
            <Image
              source={{ uri: previewModalUri }}
              style={styles.modalFullImage}
              contentFit="contain"
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
    backgroundColor: '#f1f5f9',
  },
  headerContextCard: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadows.sm,
  },
  headerPartnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  partnerName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  partnerSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgencyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20,
    gap: 12,
  },
  emptyMessagesBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    gap: 6,
  },
  emptyMessagesTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyMessagesText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginVertical: 3,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  avatarIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatDoctorAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...Shadows.sm,
  },
  messageBubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 2,
  },
  messageBubbleOther: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  senderNameText: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  senderNameMe: {
    color: 'rgba(255,255,255,0.85)',
  },
  senderNameOther: {
    color: Colors.primaryDark,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  messageTextMe: {
    color: Colors.white,
  },
  messageTextOther: {
    color: Colors.textPrimary,
  },
  imageBubbleContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  messageImage: {
    width: 200,
    height: 140,
    borderRadius: 12,
  },
  voiceNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    minWidth: 160,
  },
  audioPlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioPlayBtnMe: {
    backgroundColor: Colors.white,
  },
  audioPlayBtnOther: {
    backgroundColor: Colors.primary,
  },
  audioWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  audioBar: {
    width: 3,
    borderRadius: 2,
  },
  voiceNoteLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  timestampText: {
    fontSize: 9,
    fontWeight: '600',
  },
  timestampMe: {
    color: 'rgba(255,255,255,0.75)',
  },
  timestampOther: {
    color: Colors.textMuted,
  },
  previewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  thumbImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  thumbTextContainer: {
    flex: 1,
  },
  thumbTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  thumbSub: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  closeThumbBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fee2e2',
    borderTopWidth: 1,
    borderTopColor: '#fca5a5',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  redPulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.emergency,
  },
  recordingTimer: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.emergency,
  },
  recordingHint: {
    fontSize: 11,
    color: '#991b1b',
    fontWeight: '600',
  },
  recordingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelRecordBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  cancelRecordText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  sendRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.emergency,
  },
  sendRecordText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.white,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
    gap: 8,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 13,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  modalFullImage: {
    width: '100%',
    height: '80%',
  },
});
