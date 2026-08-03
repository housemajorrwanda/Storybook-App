import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AudioRecorder, type RecordedAudio } from '@/components/ui/audio-recorder';
import { VideoPicker, type PickedVideo } from '@/components/ui/video-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { DateField } from '@/components/ui/date-field';
import { OptionGroup, type Option } from '@/components/ui/option-group';
import {
  RelativesEditor,
  toRelativesPayload,
  type RelativeEntry,
} from '@/components/ui/relatives-editor';
import { useToast } from '@/components/ui/toast';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import api from '@/services/api';
import type { IdentityPreference, SubmissionType } from '@/types/testimony';

/**
 * Steps mirror the web's share-testimony flow exactly, so someone who submits on
 * one platform recognises the other:
 *   1 Type    — submission type, identity, language
 *   2 Details — who you are, and where/when it happened
 *   3 Content — the testimony itself, plus consent
 */
type Step = 'type' | 'details' | 'content' | 'done';
const STEPS: Exclude<Step, 'done'>[] = ['type', 'details', 'content'];

const STEP_TITLES: Record<Exclude<Step, 'done'>, { title: string; subtitle: string }> = {
  type: { title: 'How would you like to share?', subtitle: 'Choose a format and language' },
  details: { title: 'About you', subtitle: 'This helps place the testimony in context' },
  content: { title: 'Your testimony', subtitle: 'Take as much space as you need' },
};

const TYPE_OPTIONS: Option<SubmissionType>[] = [
  { value: 'written', label: 'Written', description: 'Type your testimony', icon: 'file-text' },
  { value: 'audio', label: 'Audio', description: 'Record your voice', icon: 'mic' },
  { value: 'video', label: 'Video', description: 'Record or upload a video', icon: 'video' },
];

const IDENTITY_OPTIONS: Option<IdentityPreference>[] = [
  { value: 'public', label: 'Public', description: 'Your name is shown', icon: 'user' },
  { value: 'anonymous', label: 'Anonymous', description: 'Your name is hidden', icon: 'eye-off' },
];

/** Mirrors the backend's RelationToEvent enum — values must match exactly. */
type Relation = 'Survivor' | 'Witness' | 'Family Member' | 'Community Member' | 'Rescuer' | 'Other';
const RELATION_OPTIONS: Option<Relation>[] = [
  { value: 'Survivor', label: 'Survivor' },
  { value: 'Witness', label: 'Direct Witness' },
  { value: 'Family Member', label: 'Family Member' },
  { value: 'Community Member', label: 'Community Member' },
  { value: 'Rescuer', label: 'Helper / Rescuer' },
  { value: 'Other', label: 'Other' },
];

type Language = 'rw' | 'fr' | 'en';
const LANGUAGE_OPTIONS: Option<Language>[] = [
  { value: 'rw', label: 'Kinyarwanda' },
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
];

export default function CreateScreen() {
  const theme = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { contentWidth } = useResponsive();
  const { user } = useAuth();

  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState<Step>('type');
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [type, setType] = useState<SubmissionType>('written');
  const [identityPreference, setIdentityPreference] = useState<IdentityPreference>('public');
  const [language, setLanguage] = useState<Language>('rw');

  // Step 2
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [relationToEvent, setRelationToEvent] = useState<Relation | null>(null);
  const [location, setLocation] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [relatives, setRelatives] = useState<RelativeEntry[]>([]);

  // Step 3
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [fullTestimony, setFullTestimony] = useState('');
  const [audio, setAudio] = useState<RecordedAudio | null>(null);
  const [video, setVideo] = useState<PickedVideo | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const stepIndex = step === 'done' ? STEPS.length : STEPS.indexOf(step);

  function validate(): string | null {
    if (step === 'details') {
      if (identityPreference === 'public' && !fullName.trim()) {
        return 'Please enter your full name, or choose to stay anonymous.';
      }
      if (!relationToEvent) return 'Please choose your connection to these events.';
      if (!dateFrom) return 'Please choose the date the events began.';
      if (!dateTo) return 'Please choose the date the events ended.';
      if (dateFrom > dateTo) return 'The end date cannot be before the start date.';
    }
    if (step === 'content') {
      if (!eventTitle.trim()) return 'Please give your testimony a title.';
      if (type === 'written' && fullTestimony.trim().length < 20) {
        return 'Please write a little more before submitting.';
      }
      if (type === 'audio' && !audio) return 'Please record your audio testimony.';
      if (type === 'video' && !video) return 'Please record or choose a video.';
      if (!agreedToTerms) return 'Please agree to the terms before submitting.';
    }
    return null;
  }

  function goNext() {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    Haptics.selectionAsync();
    if (stepIndex < STEPS.length - 1) {
      setStep(STEPS[stepIndex + 1]);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      submit();
    }
  }

  function goBack() {
    Haptics.selectionAsync();
    if (stepIndex > 0) {
      setStep(STEPS[stepIndex - 1]);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }

  async function submit() {
    setSubmitting(true);
    try {
      const fields: Record<string, string> = {
        submissionType: type,
        identityPreference,
        fullName: identityPreference === 'anonymous' ? 'Anonymous' : fullName.trim(),
        eventTitle: eventTitle.trim(),
        agreedToTerms: String(agreedToTerms),
      };

      // Language only means something for spoken testimony.
      if (type !== 'written') fields.language = language;
      if (relationToEvent) fields.relationToEvent = relationToEvent;
      if (eventDescription.trim()) fields.eventDescription = eventDescription.trim();
      if (location.trim()) fields.location = location.trim();
      if (dateFrom.trim()) fields.dateOfEventFrom = dateFrom.trim();
      if (dateTo.trim()) fields.dateOfEventTo = dateTo.trim();
      if (type === 'written') fields.fullTestimony = fullTestimony.trim();

      const relativesPayload = toRelativesPayload(relatives);

      const media = type === 'audio' ? audio : type === 'video' ? video : null;

      if (media) {
        // The endpoint accepts multipart with `audio` / `video` file parts, so a
        // recording has to be sent as FormData — a JSON body would drop the file.
        const form = new FormData();
        Object.entries(fields).forEach(([key, value]) => form.append(key, value));
        if (relativesPayload.length) {
          form.append('relatives', JSON.stringify(relativesPayload));
        }
        if (type === 'audio' && audio) {
          form.append('audioFileName', audio.fileName);
          form.append('audioDuration', String(audio.durationSeconds));
        }
        form.append(type, {
          uri: media.uri,
          name: media.fileName,
          type: type === 'audio' ? 'audio/m4a' : 'video/mp4',
        } as unknown as Blob);

        await api.post('/testimonies', form, {
          // Undefined lets the runtime set the multipart boundary itself; the
          // client default of application/json would corrupt the body.
          headers: { 'Content-Type': undefined as unknown as string },
          timeout: 120_000,
        });
      } else {
        await api.post('/testimonies', {
          ...fields,
          agreedToTerms,
          ...(relativesPayload.length ? { relatives: relativesPayload } : {}),
        });
      }

      setStep('done');
      toast.success('Testimony submitted for review.');
    } catch (e: any) {
      toast.error(e?.message ?? 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep('type');
    setType('written');
    setIdentityPreference('public');
    setLanguage('rw');
    setFullName(user?.fullName ?? '');
    setRelationToEvent(null);
    setLocation('');
    setDateFrom('');
    setDateTo('');
    setRelatives([]);
    setEventTitle('');
    setEventDescription('');
    setFullTestimony('');
    setAudio(null);
    setVideo(null);
    setAgreedToTerms(false);
  }

  const layout = {
    width: contentWidth,
    alignSelf: 'center' as const,
    maxWidth: '100%' as const,
  };

  if (step === 'done') {
    return (
      <ThemedView style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.done}>
          <View
            style={[styles.doneRing, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <Feather name="check-circle" size={32} color={theme.brand} />
          </View>
          <ThemedText type="title" style={styles.center}>
            Thank you
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={[styles.center, styles.doneBody]}>
            Your testimony has been submitted and is awaiting review. You can follow its status in
            My Submissions.
          </ThemedText>
          <View style={styles.doneActions}>
            <AppButton label="Share another" onPress={reset} variant="outline" size="lg" />
          </View>
        </Animated.View>
      </ThemedView>
    );
  }

  const { title, subtitle } = STEP_TITLES[step];

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Progress */}
      <View style={[styles.header, layout]}>
        <View style={styles.progressRow}>
          {STEPS.map((s, i) => (
            <View
              key={s}
              style={[
                styles.progressBar,
                { backgroundColor: i <= stepIndex ? theme.brand : theme.backgroundElement },
              ]}
            />
          ))}
        </View>
        <ThemedText themeColor="textSecondary" style={styles.stepCount}>
          Step {stepIndex + 1} of {STEPS.length}
        </ThemedText>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.scroll,
            layout,
            { paddingBottom: insets.bottom + BottomTabInset + 140 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Animated.View key={step} entering={FadeInRight.duration(260)} style={styles.stepBody}>
            <View style={styles.intro}>
              <ThemedText type="title" style={styles.introTitle}>
                {title}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.introSub}>
                {subtitle}
              </ThemedText>
            </View>

            {step === 'type' && (
              <>
                <OptionGroup
                  label="Format"
                  options={TYPE_OPTIONS}
                  value={type}
                  onChange={setType}
                  variant="cards"
                />
                <OptionGroup
                  label="Identity"
                  options={IDENTITY_OPTIONS}
                  value={identityPreference}
                  onChange={setIdentityPreference}
                  variant="grid"
                />
                {/* Language drives transcription, so it only applies to spoken
                    testimony. The web shows it for written too, which is noise. */}
                {type !== 'written' ? (
                  <OptionGroup
                    label="Language"
                    hint="Used to transcribe your recording accurately."
                    options={LANGUAGE_OPTIONS}
                    value={language}
                    onChange={setLanguage}
                  />
                ) : null}
              </>
            )}

            {step === 'details' && (
              <>
                {identityPreference === 'public' ? (
                  <AppInput
                    label="Full name"
                    placeholder="Your name"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    iconLeft="user"
                  />
                ) : (
                  <View
                    style={[
                      styles.notice,
                      { borderColor: theme.border, backgroundColor: theme.card },
                    ]}>
                    <Feather name="eye-off" size={16} color={theme.mutedForeground} />
                    <ThemedText themeColor="textSecondary" style={styles.noticeText}>
                      You chose to stay anonymous, so your name will not be recorded.
                    </ThemedText>
                  </View>
                )}

                <OptionGroup
                  label="Relation to the event"
                  options={RELATION_OPTIONS}
                  value={relationToEvent}
                  onChange={setRelationToEvent}
                />

                <AppInput
                  label="Location"
                  placeholder="e.g. Kibuye (now Karongi District)"
                  value={location}
                  onChangeText={setLocation}
                  iconLeft="map-pin"
                />

                <RelativesEditor value={relatives} onChange={setRelatives} />

                <View style={styles.dateRow}>
                  <View style={styles.dateField}>
                    <DateField
                      label="Date from"
                      value={dateFrom}
                      onChange={setDateFrom}
                      maximumDate={dateTo ? new Date(dateTo) : new Date()}
                    />
                  </View>
                  <View style={styles.dateField}>
                    <DateField
                      label="Date to"
                      value={dateTo}
                      onChange={setDateTo}
                      minimumDate={dateFrom ? new Date(dateFrom) : undefined}
                      maximumDate={new Date()}
                    />
                  </View>
                </View>
              </>
            )}

            {step === 'content' && (
              <>
                <AppInput
                  label="Title"
                  placeholder="e.g. Finding Hope Through Survival"
                  value={eventTitle}
                  onChangeText={setEventTitle}
                  iconLeft="type"
                />

                <AppInput
                  label="Short description"
                  placeholder="A brief overview (optional)"
                  value={eventDescription}
                  onChangeText={setEventDescription}
                  multiline
                  numberOfLines={3}
                />

                {type === 'written' ? (
                  <AppInput
                    label="Your testimony"
                    placeholder="Share what happened, in your own words…"
                    value={fullTestimony}
                    onChangeText={setFullTestimony}
                    multiline
                    numberOfLines={10}
                    hint={`${fullTestimony.trim().length} characters`}
                  />
                ) : type === 'audio' ? (
                  <AudioRecorder value={audio} onChange={setAudio} />
                ) : (
                  <VideoPicker value={video} onChange={setVideo} />
                )}

                <View
                  style={[
                    styles.consent,
                    { borderColor: theme.border, backgroundColor: theme.card },
                  ]}>
                  <Checkbox
                    checked={agreedToTerms}
                    onChange={setAgreedToTerms}
                    label="I agree to the terms"
                    description="I confirm this testimony is mine to share, and I consent to it being stored and reviewed before publication."
                  />
                </View>
              </>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer CTA — clears the native tab bar, not just the home indicator. */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: theme.border,
            backgroundColor: theme.background,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.two,
          },
        ]}>
        <View style={[styles.footerRow, layout]}>
          {stepIndex > 0 ? (
            <View style={styles.footerBack}>
              <AppButton label="Back" onPress={goBack} variant="ghost" size="lg" />
            </View>
          ) : null}
          <View style={styles.footerNext}>
            <AppButton
              label={stepIndex === STEPS.length - 1 ? 'Submit testimony' : 'Continue'}
              onPress={goNext}
              loading={submitting}
              size="lg"
              iconRight={stepIndex === STEPS.length - 1 ? undefined : 'arrow-right'}
            />
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.two },
  progressRow: { flexDirection: 'row', gap: Spacing.one },
  progressBar: { flex: 1, height: 3, borderRadius: 2 },
  stepCount: { fontSize: 12 },
  scroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four },
  stepBody: { gap: Spacing.four },
  intro: { gap: Spacing.one, marginBottom: Spacing.one },
  introTitle: { fontSize: 22 },
  introSub: { fontSize: 14, lineHeight: 20 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
  },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 18 },
  // Dates sit side by side; each flexes so they stay readable on small phones.
  dateRow: { flexDirection: 'row', gap: Spacing.three },
  dateField: { flex: 1 },
  consent: { padding: Spacing.three, borderRadius: 14, borderWidth: 1 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  footerBack: { flex: 1 },
  footerNext: { flex: 2 },
  done: { alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.four },
  doneRing: {
    width: 76,
    height: 76,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  center: { textAlign: 'center' },
  doneBody: { fontSize: 14, lineHeight: 20, maxWidth: 320 },
  doneActions: { alignSelf: 'stretch', maxWidth: 280, marginTop: Spacing.four },
});
