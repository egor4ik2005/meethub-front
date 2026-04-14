import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
  Modal,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Calendar, Play, Video, CheckCircle, Upload } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useRequestUpload, useCompleteUpload } from '@/lib/api/generated/upload/upload';

const CATEGORIES = ['Музыка', 'Спорт', 'ИТ', 'Гастрономия', 'Искусство', 'Театр', 'Стендап'];

// ── Upload step indicator ────────────────────────────────────────────────────
type UploadStep = 'idle' | 'requesting' | 'uploading' | 'completing' | 'done' | 'error';

// ─── Progress Bar ──────────────────────────────────────────────────────────
function ProgressBar({ progress }: { progress: Animated.Value }) {
  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width }]} />
    </View>
  );
}

// ─── Upload status label ────────────────────────────────────────────────────
function UploadStatus({ step }: { step: UploadStep }) {
  const labels: Record<UploadStep, string | null> = {
    idle: null,
    requesting: '⏳ Подготовка загрузки...',
    uploading: '⬆️ Загрузка видео...',
    completing: '🎬 Отправка на обработку...',
    done: null,
    error: null,
  };
  const label = labels[step];
  if (!label) return null;
  return (
    <View style={{ alignItems: 'center', paddingVertical: 8 }}>
      <Text style={{ color: '#1E9954', fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </View>
  );
}

// ─── Video Picker Area ─────────────────────────────────────────────────────
function VideoArea({ uri, onPick, disabled }: { uri: string | null; onPick: () => void; disabled?: boolean }) {
  if (uri) {
    return (
      <View style={styles.videoContainer}>
        <View style={[styles.video, { backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' }]}>
          <Play size={36} color="#10b981" fill="#10b981" />
          <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 8 }} numberOfLines={1}>Видео выбрано</Text>
        </View>
        <View style={styles.videoOverlay} />
        <Pressable
          onPress={onPick}
          disabled={disabled}
          style={({ pressed }) => [styles.changeVideoBtn, { opacity: pressed || disabled ? 0.6 : 1 }]}
        >
          <Video size={14} color="#fff" />
          <Text style={styles.changeVideoText}>Изменить видео</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPick}
      disabled={disabled}
      style={({ pressed }) => [styles.emptyVideo, { opacity: pressed || disabled ? 0.6 : 1 }]}
    >
      <View style={styles.emptyVideoInner}>
        <View style={styles.playCircle}>
          <Play size={28} color="#10b981" fill="#10b981" />
        </View>
        <Text style={styles.emptyVideoTitle}>Выберите видео мероприятия</Text>
        <Text style={styles.emptyVideoSub}>MP4, MOV — до 5 минут</Text>
      </View>
    </Pressable>
  );
}

// ─── Success Modal ──────────────────────────────────────────────────────────
function SuccessModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalIconWrap}>
            <CheckCircle size={48} color="#10b981" />
          </View>
          <Text style={styles.modalTitle}>Мероприятие опубликовано!</Text>
          <Text style={styles.modalBody}>Оно появится в ленте после модерации. Обычно это занимает до 24 часов.</Text>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.modalBtn, { opacity: pressed ? 0.85 : 1 }]}>
            <Text style={styles.modalBtnText}>Отлично!</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── CreateEventScreen ──────────────────────────────────────────────────────
export default function CreateEventScreen() {
  const router = useRouter();

  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [videoMimeType, setVideoMimeType] = useState<string>('video/mp4');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [dateText, setDateText] = useState('');
  const [hashtags, setHashtags] = useState('');

  const [uploadStep, setUploadStep] = useState<UploadStep>('idle');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const { mutateAsync: requestUpload } = useRequestUpload();
  const { mutateAsync: completeUpload } = useCompleteUpload();

  const isLoading = uploadStep !== 'idle' && uploadStep !== 'done' && uploadStep !== 'error';

  // ── Pick video ───────────────────────────────────────────────────────────
  const pickVideo = useCallback(async () => {
    if (isLoading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setVideoUri(asset.uri);
      // Determine filename and mime type
      const filename = asset.fileName ?? asset.uri.split('/').pop() ?? 'video.mp4';
      const mimeType = asset.mimeType ?? 'video/mp4';
      setVideoFileName(filename);
      setVideoMimeType(mimeType);
    }
  }, [isLoading]);

  // ── Animated progress ────────────────────────────────────────────────────
  const animateProgress = (from: number, to: number, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      progressAnim.setValue(from);
      Animated.timing(progressAnim, { toValue: to, duration, useNativeDriver: false })
        .start(() => resolve());
    });
  };

  // ── Publish ──────────────────────────────────────────────────────────────
  /**
   * Upload flow (Presigned URL approach):
   * 1. POST /upload/request  → get { upload_url, upload_id, s3_key }
   * 2. PUT upload_url (direct to S3) with raw video binary
   * 3. POST /upload/complete → triggers transcoding pipeline
   */
  const handlePublish = useCallback(async () => {
    if (isLoading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!title.trim()) {
      Alert.alert('Заполните название', 'Название мероприятия обязательно');
      return;
    }

    setShowProgressBar(true);
    progressAnim.setValue(0);

    try {
      if (videoUri && videoFileName) {
        // ── Step 1: Request presigned URL ───────────────────────────────
        setUploadStep('requesting');
        await animateProgress(0, 0.2, 400);

        const session = await requestUpload({
          data: { file_name: videoFileName, content_type: videoMimeType },
        });

        // ── Step 2: Upload binary to S3 via presigned PUT URL ───────────
        setUploadStep('uploading');
        await animateProgress(0.2, 0.8, 1800);

        // Fetch the file as blob and PUT to S3
        const fileResponse = await fetch(videoUri);
        const fileBlob = await fileResponse.blob();

        const s3Response = await fetch(session.upload_url, {
          method: 'PUT',
          body: fileBlob,
          headers: { 'Content-Type': videoMimeType },
        });

        if (!s3Response.ok) {
          throw new Error(`S3 upload failed: ${s3Response.status}`);
        }

        // ── Step 3: Tell backend upload is done ─────────────────────────
        setUploadStep('completing');
        await animateProgress(0.8, 0.95, 400);

        const hashtagList = hashtags
          .split(/[,\s]+/)
          .map((t) => t.replace(/^#/, '').trim())
          .filter(Boolean);

        await completeUpload({
          data: {
            upload_id: session.upload_id,
            description: `${title}: ${description} | Категория: ${category} | Дата: ${dateText}`,
            hashtags: hashtagList,
            location: location ? { name: location } : undefined,
          },
        });

        await animateProgress(0.95, 1, 300);
      } else {
        // No video — just fake progress for form-only submission
        setUploadStep('completing');
        await animateProgress(0, 1, 1800);
      }

      setUploadStep('done');
      setShowProgressBar(false);
      setShowSuccess(true);
    } catch (err: any) {
      setUploadStep('error');
      setShowProgressBar(false);
      const msg = err?.response?.data?.message ?? err?.message ?? 'Неизвестная ошибка';
      Alert.alert('Ошибка публикации', msg);
    }
  }, [
    isLoading, title, description, category, location, dateText, hashtags,
    videoUri, videoFileName, videoMimeType, requestUpload, completeUpload, progressAnim,
  ]);

  const handleModalClose = useCallback(() => {
    setShowSuccess(false);
    setUploadStep('idle');
    router.back();
  }, [router]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      {showProgressBar && <ProgressBar progress={progressAnim} />}

      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <ArrowLeft size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Новое мероприятие</Text>
          <View style={{ width: 42 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Video picker */}
          <VideoArea uri={videoUri} onPick={pickVideo} disabled={isLoading} />

          {/* Upload status */}
          <UploadStatus step={uploadStep} />

          {/* ── Form ──────────────────────────────────────────────────────── */}
          <View style={styles.form}>
            {/* Title */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>НАЗВАНИЕ *</Text>
              <TextInput
                style={styles.input}
                placeholder="Например: Tech Meetup Moscow"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={title}
                onChangeText={setTitle}
                returnKeyType="next"
                editable={!isLoading}
              />
            </View>

            {/* Description */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>ОПИСАНИЕ</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Расскажите, что произойдёт..."
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isLoading}
              />
            </View>

            {/* Category pills */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>КАТЕГОРИЯ</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
                {CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => !isLoading && setCategory(active ? '' : cat)}
                      style={({ pressed }) => [
                        styles.pill,
                        active ? styles.pillActive : styles.pillInactive,
                        { opacity: pressed ? 0.8 : 1 },
                      ]}
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>{cat}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Location */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>ЛОКАЦИЯ</Text>
              <View style={styles.inputRow}>
                <MapPin size={17} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  placeholder="Адрес или место"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={location}
                  onChangeText={setLocation}
                  returnKeyType="next"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Date & Time */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>ДАТА И ВРЕМЯ</Text>
              <View style={styles.inputRow}>
                <Calendar size={17} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  placeholder="Например: 15 июля, 20:00"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={dateText}
                  onChangeText={setDateText}
                  returnKeyType="next"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Hashtags */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>ХЭШТЕГИ</Text>
              <TextInput
                style={styles.input}
                placeholder="#музыка #москва #вечеринка"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={hashtags}
                onChangeText={setHashtags}
                returnKeyType="done"
                editable={!isLoading}
              />
            </View>

            {/* Publish button */}
            <Pressable
              onPress={handlePublish}
              disabled={isLoading}
              style={({ pressed }) => [styles.publishBtn, { opacity: isLoading ? 0.65 : pressed ? 0.85 : 1 }]}
            >
              {isLoading ? (
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.publishBtnText}>Публикую...</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Upload size={18} color="#fff" />
                  <Text style={styles.publishBtnText}>Опубликовать в MeetHub</Text>
                </View>
              )}
            </Pressable>

            <View style={{ height: 32 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessModal visible={showSuccess} onClose={handleModalClose} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0B' },
  flex: { flex: 1 },
  progressTrack: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(16,185,129,0.25)', zIndex: 100 },
  progressFill: { height: 3, backgroundColor: '#10b981' },
  safeTop: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10,
    backgroundColor: 'rgba(10,10,11,0.92)',
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#ffffff', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  videoContainer: { width: '100%', height: 240, backgroundColor: '#111', position: 'relative' },
  video: { width: '100%', height: '100%' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  changeVideoBtn: {
    position: 'absolute', bottom: 14, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.65)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12,
    paddingVertical: 7, borderRadius: 20,
  },
  changeVideoText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyVideo: {
    width: '100%', height: 220, backgroundColor: 'rgba(255,255,255,0.03)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(16,185,129,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyVideoInner: { alignItems: 'center', gap: 10 },
  playCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 1.5,
    borderColor: 'rgba(16,185,129,0.4)', alignItems: 'center',
    justifyContent: 'center', marginBottom: 4,
  },
  emptyVideoTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  emptyVideoSub: { color: '#6b7280', fontSize: 13 },
  scrollContent: { paddingTop: 96 },
  form: { paddingHorizontal: 20, paddingTop: 24, gap: 20 },
  fieldGroup: { gap: 8 },
  label: { color: '#6b7280', fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13,
    color: '#ffffff', fontSize: 15, fontWeight: '500',
  },
  textarea: { minHeight: 100, paddingTop: 13 },
  inputRow: { position: 'relative', justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 14, zIndex: 1 },
  inputWithIcon: { paddingLeft: 42 },
  pillsRow: { gap: 8, paddingVertical: 2 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  pillInactive: { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.15)' },
  pillActive: {
    backgroundColor: '#10b981', borderColor: '#10b981',
    shadowColor: '#10b981', shadowOpacity: 0.4, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 6,
  },
  pillText: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
  pillTextActive: { color: '#ffffff' },
  publishBtn: {
    backgroundColor: '#10b981', borderRadius: 18, paddingVertical: 17,
    alignItems: 'center', marginTop: 8,
    shadowColor: '#10b981', shadowOpacity: 0.45, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
  publishBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  modalCard: {
    backgroundColor: '#141414', borderRadius: 24, padding: 32,
    alignItems: 'center', width: '100%',
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', gap: 12,
  },
  modalIconWrap: { marginBottom: 4 },
  modalTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  modalBody: { color: '#9ca3af', fontSize: 14, lineHeight: 22, textAlign: 'center', paddingHorizontal: 8 },
  modalBtn: {
    marginTop: 8, backgroundColor: '#10b981', borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 40,
    shadowColor: '#10b981', shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  modalBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
