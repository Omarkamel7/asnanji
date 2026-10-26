import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  FlatList,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { DoctorAvatar } from '../components/DoctorAvatar';
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
  Calendar,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  Search,
  Phone,
  MessageCircle,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Colors, Shadows } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { ChatMessage, DentalComplaint } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { uploadDentalPhoto, uploadDentalAudio } from '../services/supabaseStorage';

interface ChatScreenProps {
  route?: any;
  navigation?: any;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
  const {
    messages,
    sendMessage,
    role,
    t,
    language,
    complaints,
    isRTL,
    currentUser,
    savePatientQuickProfile,
    refreshClinicData,
    clinicSettings,
  } = useApp();

  // Search state for WhatsApp Chats List
  const [searchQuery, setSearchQuery] = useState('');

  // Active Patient / Active Conversation State
  const initialPatientId = route?.params?.patientId || (
    route?.params?.consultationId
      ? complaints.find((c) => c.id === route.params.consultationId)?.patientId
      : undefined
  );
  const [activePatientId, setActivePatientId] = useState<string | null>(
    initialPatientId || null
  );

  // Group all consultations by Patient ID to create unified, patient-centric WhatsApp threads
  const patientThreads = useMemo(() => {
    const map = new Map<
      string,
      {
        patientId: string;
        patientName: string;
        patientPhone: string;
        complaints: DentalComplaint[];
        latestComplaint: DentalComplaint;
        consultationIds: string[];
      }
    >();

    complaints.forEach((c) => {
      const pId = c.patientId || 'unknown_patient';
      if (!map.has(pId)) {
        map.set(pId, {
          patientId: pId,
          patientName: c.patientName || (language === 'ar' ? 'مريض' : 'Patient'),
          patientPhone: c.patientPhone || '',
          complaints: [c],
          latestComplaint: c,
          consultationIds: [c.id],
        });
      } else {
        const entry = map.get(pId)!;
        entry.complaints.push(c);
        entry.consultationIds.push(c.id);
        if (new Date(c.createdAt).getTime() > new Date(entry.latestComplaint.createdAt).getTime()) {
          entry.latestComplaint = c;
        }
      }
    });

    const list = Array.from(map.values()).map((entry) => {
      // Find all messages belonging to any of this patient's consultations
      const threadMessages = messages.filter((m) =>
        entry.consultationIds.includes(m.consultationId)
      );

      threadMessages.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const lastMsg = threadMessages.length > 0 ? threadMessages[threadMessages.length - 1] : null;

      let lastMessageText =
        entry.latestComplaint.description || (language === 'ar' ? 'طلب استشارة جديد' : 'New consultation');
      if (lastMsg) {
        if (lastMsg.audioUri) {
          lastMessageText = language === 'ar' ? '🎤 تسجيل صوتي' : '🎤 Voice Note';
        } else if (lastMsg.imageUri) {
          lastMessageText = language === 'ar' ? '📷 صورة مرفقة' : '📷 Photo';
        } else {
          lastMessageText = lastMsg.text;
        }
      }

      const lastTimestamp = lastMsg ? lastMsg.timestamp : entry.latestComplaint.createdAt;
      const hasUrgent = entry.complaints.some((c) => c.urgencyLevel === 'urgent' || c.painLevel >= 7);
      const isDiagnosed = entry.complaints.some((c) => c.status === 'diagnosed');

      return {
        ...entry,
        threadMessages,
        lastMsg,
        lastMessageText,
        lastTimestamp,
        hasUrgent,
        isDiagnosed,
      };
    });

    // Sort threads by last message time descending (WhatsApp style)
    list.sort((a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime());

    return list;
  }, [complaints, messages, language]);

  // Handle route params updates when navigating from external screens (e.g. Dashboard or Detail)
  useEffect(() => {
    if (route?.params?.patientId) {
      setActivePatientId(route.params.patientId);
    } else if (route?.params?.consultationId) {
      const match = complaints.find((c) => c.id === route.params.consultationId);
      if (match?.patientId) {
        setActivePatientId(match.patientId);
      }
    }
  }, [route?.params?.patientId, route?.params?.consultationId, complaints]);

  // If role is patient, they automatically see their active consultation thread
  useEffect(() => {
    if (role === 'patient') {
      if (patientThreads.length > 0) {
        setActivePatientId(patientThreads[0].patientId);
      } else if (currentUser?.id) {
        setActivePatientId(currentUser.id);
      }
    }
  }, [role, patientThreads, currentUser?.id]);

  // Find the currently active thread
  const activeThread = useMemo(() => {
    if (!activePatientId) return null;
    return patientThreads.find((t) => t.patientId === activePatientId) || null;
  }, [patientThreads, activePatientId]);

  // Filter messages for this active patient thread
  const consultationMessages = useMemo(() => {
    if (activeThread) {
      const msgs = messages.filter((m) => activeThread.consultationIds.includes(m.consultationId));
      return msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
    return [];
  }, [activeThread, messages]);

  const activeConsultationId = activeThread?.latestComplaint?.id || (complaints[0]?.id || '');
  const linkedComplaint = activeThread?.latestComplaint;

  // Realtime Postgres Subscription for Active Thread Messages
  useEffect(() => {
    if (!isSupabaseConfigured || !activeThread || activeThread.consultationIds.length === 0) return;

    const channel = supabase
      .channel(`realtime:patient_thread:${activeThread.patientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newRow = payload.new as any;
          if (
            newRow &&
            activeThread.consultationIds.includes(newRow.consultation_id) &&
            !messages.some((m) => m.id === newRow.id)
          ) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeThread, messages]);

  // Filtered threads for WhatsApp search
  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return patientThreads;
    const q = searchQuery.toLowerCase().trim();
    return patientThreads.filter(
      (t) =>
        t.patientName.toLowerCase().includes(q) ||
        t.patientPhone.includes(q) ||
        t.lastMessageText.toLowerCase().includes(q)
    );
  }, [patientThreads, searchQuery]);

  // Input & Media States
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [previewModalUri, setPreviewModalUri] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [diagnosisExpanded, setDiagnosisExpanded] = useState(true);

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

  // Voice recording states
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const webChatMediaRecorderRef = useRef<any>(null);
  const webChatAudioChunksRef = useRef<Blob[]>([]);
  const webChatAudioPlayerRef = useRef<any>(null);
  const [activeAudioUri, setActiveAudioUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Patient Quick Profile Modal States
  const hasPatientInfo = !!(
    currentUser?.fullName &&
    currentUser?.phone &&
    currentUser.phone.replace(/[^0-9]/g, '').length >= 8
  );
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [patientNameInput, setPatientNameInput] = useState(currentUser?.fullName || '');
  const [patientPhoneInput, setPatientPhoneInput] = useState(currentUser?.phone || '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 150);
    return () => clearTimeout(timer);
  }, [consultationMessages.length, activePatientId]);

  const checkPatientProfileBeforeAction = (): boolean => {
    if (role === 'doctor' || role === 'assistant' || role === 'admin') return true;
    if (!hasPatientInfo) {
      setShowProfileModal(true);
      return false;
    }
    return true;
  };

  const handleSaveProfile = async () => {
    let valid = true;
    if (!patientNameInput.trim()) {
      setNameError(language === 'ar' ? 'الاسم مطلوب' : 'Name is required');
      valid = false;
    } else {
      setNameError(null);
    }

    const cleanPhone = patientPhoneInput.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 8) {
      setPhoneError(
        language === 'ar' ? 'يرجى إدخال رقم هاتف صحيح' : 'Valid phone required'
      );
      valid = false;
    } else {
      setPhoneError(null);
    }

    if (!valid) return;

    await savePatientQuickProfile(patientNameInput.trim(), cleanPhone);
    setShowProfileModal(false);
  };

  // Pick Image from Library
  const pickImage = async () => {
    if (!checkPatientProfileBeforeAction()) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  // Cross-platform Voice Recording
  const startVoiceRecording = async () => {
    if (!checkPatientProfileBeforeAction()) return;
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new (window as any).MediaRecorder(stream);
          webChatMediaRecorderRef.current = mediaRecorder;
          webChatAudioChunksRef.current = [];

          mediaRecorder.ondataavailable = (e: any) => {
            if (e.data && e.data.size > 0) webChatAudioChunksRef.current.push(e.data);
          };

          mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(webChatAudioChunksRef.current, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            stream.getTracks().forEach((track) => track.stop());

            setIsSending(true);
            const cloudAudioUri = await uploadDentalAudio(audioUrl, role);
            await sendMessage(
              activeConsultationId,
              language === 'ar' ? '🎤 تسجيل صوتي' : '🎤 Voice Note',
              cloudAudioUri,
              undefined
            );
            setIsSending(false);
          };

          mediaRecorder.start();
          setIsRecording(true);
          setRecordSeconds(0);
          timerRef.current = setInterval(() => {
            setRecordSeconds((prev) => prev + 1);
          }, 1000);
          return;
        } else {
          Alert.alert('تنبيه', 'المتصفح لا يدعم تسجيل الصوت');
          return;
        }
      }

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
    try {
      if (timerRef.current) clearInterval(timerRef.current);

      if (Platform.OS === 'web') {
        if (webChatMediaRecorderRef.current && webChatMediaRecorderRef.current.state !== 'inactive') {
          webChatMediaRecorderRef.current.stop();
          setIsRecording(false);
          setRecordSeconds(0);
        }
        return;
      }

      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      setRecordSeconds(0);

      if (uri) {
        setIsSending(true);
        const cloudAudioUri = await uploadDentalAudio(uri, role);
        await sendMessage(
          activeConsultationId,
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
    try {
      if (timerRef.current) clearInterval(timerRef.current);

      if (Platform.OS === 'web') {
        if (webChatMediaRecorderRef.current && webChatMediaRecorderRef.current.state !== 'inactive') {
          webChatMediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setRecordSeconds(0);
        return;
      }

      if (!recording) return;
      await recording.stopAndUnloadAsync();
      setRecording(null);
      setIsRecording(false);
      setRecordSeconds(0);
    } catch (e) {
      console.warn('Cancel recording error:', e);
    }
  };

  const handleToggleAudio = async (audioUri: string) => {
    try {
      if (Platform.OS === 'web') {
        if (activeAudioUri === audioUri && isPlayingAudio && webChatAudioPlayerRef.current) {
          webChatAudioPlayerRef.current.pause();
          setIsPlayingAudio(false);
          return;
        }
        if (webChatAudioPlayerRef.current) {
          try {
            webChatAudioPlayerRef.current.pause();
          } catch (_) {}
        }
        const audio = new (window as any).Audio(audioUri);
        webChatAudioPlayerRef.current = audio;
        setActiveAudioUri(audioUri);
        setIsPlayingAudio(true);
        audio.onended = () => {
          setIsPlayingAudio(false);
          setActiveAudioUri(null);
        };
        await audio.play();
        return;
      }

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
      console.warn('Audio play toggle error:', err);
      setIsPlayingAudio(false);
    }
  };

  const handleSend = async () => {
    if (!checkPatientProfileBeforeAction()) return;
    if (!inputMessage.trim() && !selectedImageUri) return;

    lightTap();
    setIsSending(true);

    try {
      let cloudImageUri: string | undefined = undefined;
      if (selectedImageUri) {
        cloudImageUri = (await uploadDentalPhoto(selectedImageUri, role)) || undefined;
      }

      await sendMessage(activeConsultationId, inputMessage.trim(), undefined, cloudImageUri);
      setInputMessage('');
      setSelectedImageUri(null);
    } catch (err) {
      console.warn('Send message error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isMe = role === item.senderRole;
      const hasAudio = !!item.audioUri;
      const hasImage = !!item.imageUri;

      return (
        <View
          style={[
            styles.messageWrapper,
            isMe ? styles.messageWrapperMe : styles.messageWrapperOther,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isMe ? styles.bubbleMe : styles.bubbleOther,
            ]}
          >
            <Text style={[styles.senderName, isMe ? styles.senderNameMe : styles.senderNameOther]}>
              {item.senderName}
            </Text>

            {hasImage && (
              <TouchableOpacity
                onPress={() => setPreviewModalUri(item.imageUri!)}
                activeOpacity={0.9}
                style={styles.imageBubbleContainer}
              >
                <Image
                  source={{ uri: item.imageUri! }}
                  style={styles.attachedImage}
                  contentFit="cover"
                />
              </TouchableOpacity>
            )}

            {hasAudio && (
              <View style={styles.audioBubbleContainer}>
                <TouchableOpacity
                  style={[
                    styles.audioPlayBtn,
                    isMe ? styles.audioPlayBtnMe : styles.audioPlayBtnOther,
                  ]}
                  onPress={() => handleToggleAudio(item.audioUri!)}
                >
                  {activeAudioUri === item.audioUri && isPlayingAudio ? (
                    <Pause size={16} color={isMe ? Colors.primary : Colors.white} />
                  ) : (
                    <Play size={16} color={isMe ? Colors.primary : Colors.white} />
                  )}
                </TouchableOpacity>
                <View style={styles.audioWaveform}>
                  <View style={[styles.waveBar, { height: 16 }]} />
                  <View style={[styles.waveBar, { height: 24 }]} />
                  <View style={[styles.waveBar, { height: 12 }]} />
                  <View style={[styles.waveBar, { height: 28 }]} />
                  <View style={[styles.waveBar, { height: 20 }]} />
                  <View style={[styles.waveBar, { height: 14 }]} />
                </View>
              </View>
            )}

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

            <View style={styles.messageFooter}>
              <Text
                style={[
                  styles.messageTime,
                  isMe ? styles.messageTimeMe : styles.messageTimeOther,
                ]}
              >
                {new Date(item.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              {isMe && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 4 }}>
                  <CheckCheck size={12} color="rgba(255,255,255,0.75)" />
                </View>
              )}
            </View>
          </View>
        </View>
      );
    },
    [role, activeAudioUri, isPlayingAudio]
  );

  // ==========================================
  // VIEW 1: WHATSAPP-STYLE CHATS INBOX LIST
  // (Rendered for Doctors when no active patient is selected)
  // ==========================================
  if ((role === 'doctor' || role === 'assistant' || role === 'admin') && !activePatientId) {
    return (
      <View style={styles.whatsAppRoot}>
        {/* WhatsApp Top Header Bar */}
        <View style={styles.whatsAppHeader}>
          <Text style={styles.whatsAppHeaderTitle}>
            {language === 'ar' ? 'المحادثات الطبية' : 'Patient Chats'}
          </Text>
          <View style={styles.headerBadgePill}>
            <Text style={styles.headerBadgePillText}>
              {patientThreads.length} {language === 'ar' ? 'مريض' : 'Patients'}
            </Text>
          </View>
        </View>

        {/* WhatsApp Search Input Bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              language === 'ar'
                ? 'البحث بالاسم أو رقم الهاتف...'
                : 'Search by patient name or phone...'
            }
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
            textAlign={isRTL ? 'right' : 'left'}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        {/* Vertical WhatsApp Chat Rows List */}
        <FlatList
          data={filteredThreads}
          keyExtractor={(item) => item.patientId}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <View style={styles.emptyInboxContainer}>
              <View style={styles.emptyIconCircle}>
                <MessageCircle size={38} color="#0284c7" />
              </View>
              <Text style={styles.emptyInboxTitle}>
                {language === 'ar'
                  ? 'لا توجد محادثات نشطة مع المرضى حالياً'
                  : 'No active patient chats'}
              </Text>
              <Text style={styles.emptyInboxSubtitle}>
                {language === 'ar'
                  ? 'ستظهر هنا استشارات المرضى فور استلامها في عيادتك للرد عليهم مباشرة ومتابعة حالتهم.'
                  : 'Patient consultations will appear here once received.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const initial = item.patientName.charAt(0) || 'م';
            const formattedTime = new Date(item.lastTimestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <TouchableOpacity
                style={styles.chatRowItem}
                onPress={() => setActivePatientId(item.patientId)}
                activeOpacity={0.7}
              >
                {/* Patient Circular Avatar */}
                <View style={styles.chatRowAvatar}>
                  <Text style={styles.chatRowAvatarText}>{initial}</Text>
                  <View style={styles.chatRowOnlineDot} />
                </View>

                {/* Middle Info Column */}
                <View style={styles.chatRowMiddle}>
                  <View style={styles.chatRowTopLine}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <Text style={styles.chatRowName} numberOfLines={1}>
                        {item.patientName}
                      </Text>
                      {item.complaints.length > 1 && (
                        <View style={styles.caseCountBadge}>
                          <Text style={styles.caseCountBadgeText}>
                            {item.complaints.length} {language === 'ar' ? 'استشارات' : 'Cases'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.chatRowTime}>{formattedTime}</Text>
                  </View>

                  {/* Bottom Preview Line */}
                  <View style={styles.chatRowBottomLine}>
                    <Text style={styles.chatRowSnippet} numberOfLines={1}>
                      {item.lastMessageText}
                    </Text>
                    {item.hasUrgent && (
                      <View style={styles.urgentPill}>
                        <Text style={styles.urgentPillText}>عاجل 🚨</Text>
                      </View>
                    )}
                    {item.isDiagnosed ? (
                      <View style={styles.diagnosedPill}>
                        <Text style={styles.diagnosedPillText}>معتمد ✅</Text>
                      </View>
                    ) : (
                      <View style={styles.pendingPill}>
                        <Text style={styles.pendingPillText}>انتظار ⏳</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE WHATSAPP CONVERSATION SCREEN
  // (Full interactive chat with Back button & unified patient thread)
  // ==========================================
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* WhatsApp Active Chat Top Bar */}
      <View style={styles.activeChatHeader}>
        {/* Back Button to return to WhatsApp chats list */}
        {(role === 'doctor' || role === 'assistant' || role === 'admin') && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (activePatientId) {
                setActivePatientId(null);
              } else if (navigation?.canGoBack()) {
                navigation.goBack();
              }
            }}
          >
            {isRTL ? <ArrowRight size={22} color="#ffffff" /> : <ArrowLeft size={22} color="#ffffff" />}
          </TouchableOpacity>
        )}

        {/* Partner Avatar & Info */}
        <View style={styles.activePartnerInfo}>
          {role === 'patient' ? (
            <DoctorAvatar
              name={linkedComplaint?.diagnosis?.doctorName || (language === 'ar' ? 'طبيب الاستشارة' : 'Doctor')}
              size={38}
              style={styles.chatHeaderAvatar}
            />
          ) : (
            <View style={styles.patientAvatarHeader}>
              <Text style={styles.patientAvatarHeaderText}>
                {linkedComplaint?.patientName ? linkedComplaint.patientName.charAt(0) : 'م'}
              </Text>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.activePartnerName} numberOfLines={1}>
                {role === 'doctor'
                  ? linkedComplaint?.patientName || (language === 'ar' ? 'المريض' : 'Patient')
                  : linkedComplaint?.diagnosis?.doctorName || (language === 'ar' ? 'طبيب الاستشارة' : 'Consulting Doctor')}
              </Text>
            </View>
            <Text style={styles.activePartnerSub}>
              {role === 'doctor'
                ? (language === 'ar' ? 'محادثة استشارة طبية مباشرة' : 'Direct Consultation Chat')
                : (language === 'ar' ? 'استشاري طب وجراحة الأسنان • متصل' : 'Consultant Dentist • Online')}
            </Text>
          </View>
        </View>

        {/* Call Clinic Option ONLY for Patient when Clinic Phone is set */}
        {role === 'patient' && !!clinicSettings?.phoneNumber && (
          <TouchableOpacity
            style={styles.clinicCallBtn}
            onPress={() => Linking.openURL(`tel:${clinicSettings.phoneNumber}`)}
            activeOpacity={0.8}
          >
            <Phone size={13} color="#ffffff" />
            <Text style={styles.clinicCallBtnText}>
              {language === 'ar' ? 'اتصال بالعيادة' : 'Call Clinic'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pinned Doctor Diagnosis Card */}
      {linkedComplaint?.diagnosis && (
        <View style={styles.pinnedDiagnosisCard}>
          <TouchableOpacity
            style={styles.pinnedDiagnosisHeader}
            onPress={() => setDiagnosisExpanded(!diagnosisExpanded)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={styles.diagnosisIconCircle}>
                <Stethoscope size={16} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.pinnedDiagnosisTitle}>
                    {language === 'ar' ? 'تشخيص الطبيب المعتمد' : 'Verified Diagnosis'}
                  </Text>
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>معتمد ✅</Text>
                  </View>
                </View>
                <Text style={styles.pinnedDiagnosisDoctor}>
                  {linkedComplaint.diagnosis.doctorName || (language === 'ar' ? 'طبيب العيادة' : 'Clinic Doctor')}
                </Text>
              </View>
            </View>
            {diagnosisExpanded ? (
              <ChevronUp size={18} color="#059669" />
            ) : (
              <ChevronDown size={18} color="#059669" />
            )}
          </TouchableOpacity>

          {/* Condition Preview */}
          <View style={styles.diagnosisConditionRow}>
            <Text style={styles.conditionLabel}>
              {language === 'ar' ? 'الحالة:' : 'Condition:'}
            </Text>
            <Text style={styles.conditionValue}>
              {linkedComplaint.diagnosis.provisionalConditionAr || linkedComplaint.diagnosis.provisionalConditionEn}
            </Text>
          </View>

          {/* Expanded Details */}
          {diagnosisExpanded && (
            <View style={styles.diagnosisExpandedContent}>
              {!!linkedComplaint.diagnosis.recommendedMedicationsAr && (
                <View style={styles.diagnosisSection}>
                  <Text style={styles.diagnosisSectionTitle}>
                    💊 {language === 'ar' ? 'الأدوية الموصى بها:' : 'Medications:'}
                  </Text>
                  <Text style={styles.diagnosisSectionBody}>
                    {linkedComplaint.diagnosis.recommendedMedicationsAr}
                  </Text>
                </View>
              )}

              {!!linkedComplaint.diagnosis.firstAidInstructionsAr && (
                <View style={styles.diagnosisSection}>
                  <Text style={styles.diagnosisSectionTitle}>
                    💡 {language === 'ar' ? 'الإرشادات الطبية:' : 'Instructions:'}
                  </Text>
                  <Text style={styles.diagnosisSectionBody}>
                    {linkedComplaint.diagnosis.firstAidInstructionsAr}
                  </Text>
                </View>
              )}

              {role === 'patient' && (
                <TouchableOpacity
                  style={styles.bookFromDiagnosisBtn}
                  onPress={() =>
                    navigation.navigate('Appointments', {
                      doctorId: linkedComplaint.doctorId,
                    })
                  }
                >
                  <Calendar size={15} color="#ffffff" />
                  <Text style={styles.bookFromDiagnosisBtnText}>
                    {language === 'ar' ? 'حجز موعد للمعاينة بالعيادة 📅' : 'Book Clinic Appointment 📅'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* Messages FlatList */}
      <FlatList
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
              {role === 'doctor'
                ? (language === 'ar' ? 'لا توجد رسائل سابقة مع المريض' : 'No previous messages')
                : (language === 'ar' ? 'ابدأ المحادثة مع الطبيب الآن' : 'Start consultation with doctor')}
            </Text>
            <Text style={styles.emptyMessagesText}>
              {role === 'doctor'
                ? (language === 'ar' ? 'يمكنك إرسال رسائل أو صور أو تسجيلات صوتية للمريض لمتابعة حالته.' : 'Send messages, photos, or voice notes.')
                : (language === 'ar'
                    ? 'يمكنك إرسال استفساراتك، صور الأسنان أو الأشعة، والتسجيلات الصوتية مباشرة.'
                    : 'Send questions, dental X-rays, or voice notes directly.')}
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
            <View style={styles.recordingDot} />
            <Text style={styles.recordingTimer}>
              00:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds}
            </Text>
          </View>
          <Text style={styles.recordingHint}>
            {language === 'ar' ? 'جاري تسجيل رسالة صوتية...' : 'Recording voice message...'}
          </Text>
          <View style={styles.recordingActions}>
            <TouchableOpacity onPress={cancelVoiceRecording} style={styles.cancelRecordBtn}>
              <Text style={styles.cancelRecordText}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={stopAndSendVoiceRecording}
              style={styles.sendRecordBtn}
            >
              <Send size={14} color={Colors.white} />
              <Text style={styles.sendRecordText}>{language === 'ar' ? 'إرسال' : 'Send'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quick Clinical Canned Responses Row */}
      {role === 'doctor' && (
        <View style={styles.cannedContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cannedScroll}>
            {CANNED_RESPONSES.map((item) => {
              const chipTitle = language === 'ar' ? item.titleAr : item.titleEn;
              const chipText = language === 'ar' ? item.textAr : item.textEn;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.cannedChip}
                  onPress={() => setInputMessage(chipText)}
                >
                  <Text style={styles.cannedText}>{chipTitle}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* WhatsApp Input Bar */}
      <View style={styles.inputContainer}>
        {/* Attach Image from Gallery */}
        <TouchableOpacity
          style={styles.attachBtn}
          onPress={pickImage}
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
          style={styles.textInput}
          placeholder={
            role === 'doctor'
              ? language === 'ar'
                ? 'اكتب ردك أو تشخيصك للمريض...'
                : 'Reply to patient...'
              : language === 'ar'
                ? 'اكتب رسالتك أو استفسارك هنا...'
                : 'Type your message...'
          }
          value={inputMessage}
          onChangeText={setInputMessage}
          multiline
          placeholderTextColor={Colors.textMuted}
          textAlign={isRTL ? 'right' : 'left'}
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
            <Send size={18} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>

      {/* Full-Screen Image Zoom Modal */}
      <Modal visible={!!previewModalUri} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setPreviewModalUri(null)}
          >
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          {previewModalUri && (
            <Image
              source={{ uri: previewModalUri }}
              style={styles.fullScreenImage}
              contentFit="contain"
            />
          )}
        </View>
      </Modal>

      {/* Patient Profile Registration Modal */}
      <Modal visible={showProfileModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.profileModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalCardTitle}>
                {language === 'ar' ? 'تسجيل بيانات المريض أولاً' : 'Patient Registration'}
              </Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              {language === 'ar'
                ? 'يرجى إدخال اسمك ورقم هاتفك ليتعرف عليك الطبيب وتصلك الردود مباشرة.'
                : 'Enter your name and phone number to start chatting with your doctor.'}
            </Text>

            <Text style={styles.modalInputLabel}>
              {language === 'ar' ? 'الاسم بالكامل:' : 'Full Name:'}
            </Text>
            <TextInput
              style={[styles.modalInput, nameError ? { borderColor: '#ef4444' } : null]}
              placeholder="مثال: عمر أحمد صلاح"
              value={patientNameInput}
              onChangeText={setPatientNameInput}
              textAlign={isRTL ? 'right' : 'left'}
            />

            <Text style={styles.modalInputLabel}>
              {language === 'ar' ? 'رقم الهاتف للتواصل:' : 'Phone Number:'}
            </Text>
            <TextInput
              style={[styles.modalInput, phoneError ? { borderColor: '#ef4444' } : null]}
              placeholder="010XXXXXXXX"
              keyboardType="phone-pad"
              value={patientPhoneInput}
              onChangeText={setPatientPhoneInput}
              textAlign={isRTL ? 'right' : 'left'}
            />

            <TouchableOpacity style={styles.saveProfileBtn} onPress={handleSaveProfile}>
              <Text style={styles.saveProfileBtnText}>
                {language === 'ar' ? 'حفظ ومتابعة المحادثة 💬' : 'Save & Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  // WhatsApp Inbox List Styles
  whatsAppRoot: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  whatsAppHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#075e54',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  whatsAppHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerBadgePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  headerBadgePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    marginHorizontal: 12,
    marginVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1e293b',
  },
  chatRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  chatRowAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 12,
  },
  chatRowAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  chatRowOnlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  chatRowMiddle: {
    flex: 1,
  },
  chatRowTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatRowName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  chatRowTime: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  chatRowBottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  chatRowSnippet: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
  },
  caseCountBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  caseCountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284c7',
  },
  urgentPill: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  urgentPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
  },
  diagnosedPill: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  diagnosedPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  pendingPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  pendingPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#d97706',
  },
  emptyInboxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyInboxTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyInboxSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Active Chat Screen Styles
  container: {
    flex: 1,
    backgroundColor: '#ece5dd', // Classic WhatsApp warm chat background
  },
  activeChatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#075e54',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  backButton: {
    padding: 6,
  },
  activePartnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  chatHeaderAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  patientAvatarHeader: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientAvatarHeaderText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  activePartnerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  activePartnerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  clinicCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  clinicCallBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Pinned Diagnosis Card
  pinnedDiagnosisCard: {
    backgroundColor: '#ecfdf5',
    borderBottomWidth: 1,
    borderBottomColor: '#a7f3d0',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pinnedDiagnosisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diagnosisIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinnedDiagnosisTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065f46',
  },
  verifiedBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  pinnedDiagnosisDoctor: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '600',
  },
  diagnosisConditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  conditionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
  },
  conditionValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857',
    flex: 1,
  },
  diagnosisExpandedContent: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#d1fae5',
  },
  diagnosisSection: {
    marginBottom: 6,
  },
  diagnosisSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 2,
  },
  diagnosisSectionBody: {
    fontSize: 12,
    color: '#1f2937',
    lineHeight: 18,
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bookFromDiagnosisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 6,
    gap: 6,
  },
  bookFromDiagnosisBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Messages List
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  messageWrapper: {
    marginVertical: 4,
    maxWidth: '82%',
  },
  messageWrapperMe: {
    alignSelf: 'flex-start',
  },
  messageWrapperOther: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...Shadows.sm,
  },
  bubbleMe: {
    backgroundColor: '#dcf8c6', // WhatsApp classic green bubble for sender
    borderTopLeftRadius: 0,
  },
  bubbleOther: {
    backgroundColor: '#ffffff', // Clean white bubble for receiver
    borderTopRightRadius: 0,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
  },
  senderNameMe: {
    color: '#075e54',
  },
  senderNameOther: {
    color: '#0284c7',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#111827',
  },
  messageTextOther: {
    color: '#111827',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
    color: '#9ca3af',
  },
  messageTimeMe: {
    color: '#65676b',
  },
  messageTimeOther: {
    color: '#9ca3af',
  },
  imageBubbleContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 6,
  },
  attachedImage: {
    width: 220,
    height: 160,
    borderRadius: 8,
  },
  audioBubbleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  audioPlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioPlayBtnMe: {
    backgroundColor: '#ffffff',
  },
  audioPlayBtnOther: {
    backgroundColor: '#075e54',
  },
  audioWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveBar: {
    width: 3,
    backgroundColor: '#9ca3af',
    borderRadius: 2,
  },

  // Empty Messages Box
  emptyMessagesBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyMessagesTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyMessagesText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Input Bar
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#075e54',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94a3b8',
  },

  // Preview & Recording Bars
  previewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  thumbImage: {
    width: 44,
    height: 44,
    borderRadius: 6,
    marginRight: 10,
  },
  thumbTextContainer: {
    flex: 1,
  },
  thumbTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  thumbSub: {
    fontSize: 11,
    color: '#64748b',
  },
  closeThumbBtn: {
    padding: 6,
  },
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#fca5a5',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
  },
  recordingTimer: {
    fontSize: 13,
    fontWeight: '800',
    color: '#dc2626',
  },
  recordingHint: {
    fontSize: 12,
    color: '#991b1b',
  },
  recordingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelRecordBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cancelRecordText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '700',
  },
  sendRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  sendRecordText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '800',
  },
  cannedContainer: {
    backgroundColor: '#f8fafc',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  cannedScroll: {
    paddingHorizontal: 10,
  },
  cannedChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  cannedText: {
    fontSize: 12,
    color: '#334155',
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullScreenImage: {
    width: '90%',
    height: '75%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  profileModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    ...Shadows.md,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 18,
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 14,
  },
  saveProfileBtn: {
    backgroundColor: '#075e54',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  saveProfileBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
