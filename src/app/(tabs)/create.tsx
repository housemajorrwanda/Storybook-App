import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import api from '@/services/api';
import type { IdentityPreference, SubmissionType } from '@/types/testimony';

type Step = 'type' | 'event' | 'testimony' | 'identity' | 'done';

const STEPS: Step[] = ['type', 'event', 'testimony', 'identity'];

const TYPE_OPTIONS: {
  type: SubmissionType;
  symbol: string;
  label: string;
  desc: string;
  available: boolean;
}[] = [
  { type: 'written', symbol: 'doc.text.fill', label: 'Written', desc: 'Type your testimony', available: true },
  { type: 'audio', symbol: 'waveform', label: 'Audio', desc: 'Record your voice', available: false },
  { type: 'video', symbol: 'video.fill', label: 'Video', desc: 'Record a video', available: false },
];

const STEP_LABELS: Record<Step, string> = {
  type: 'Type',
  event: 'Event',
  testimony: 'Testimony',
  identity: 'Identity',
  done: 'Done',
};

function StepIndicator({ current }: { current: Step }) {
  const theme = useTheme();
  const idx = STEPS.indexOf(current);
  return (
    <View style={ind.wrapper}>
      <View style={ind.row}>
        {STEPS.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <View key={s} style={ind.item}>
              {/* Half-line left */}
              <View
                style={[
                  ind.halfLine,
                  { backgroundColor: i === 0 ? 'transparent' : i <= idx ? theme.primary : theme.border },
                ]}
              />
              {/* Dot */}
              <View
                style={[
                  ind.dot,
                  { backgroundColor: done || active ? theme.primary : theme.secondary, borderColor: theme.border },
                ]}>
                {done ? (
                  <SymbolView name="checkmark" size={10} tintColor={theme.primaryForeground} />
                ) : (
                  <ThemedText
                    style={[ind.dotNum, { color: active ? theme.primaryForeground : theme.mutedForeground }]}>
                    {i + 1}
                  </ThemedText>
                )}
              </View>
              {/* Half-line right */}
              <View
                style={[
                  ind.halfLine,
                  { backgroundColor: i === STEPS.length - 1 ? 'transparent' : done ? theme.primary : theme.border },
                ]}
              />
            </View>
          );
        })}
      </View>
      {/* Labels row */}
      <View style={ind.labels}>
        {STEPS.map((s, i) => (
          <ThemedText
            key={s}
            style={[ind.label, { color: i === idx ? theme.foreground : theme.mutedForeground }]}>
            {STEP_LABELS[s]}
          </ThemedText>
        ))}
      </View>
    </View>
  );
}

const ind = StyleSheet.create({
  wrapper: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.three, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  item: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  halfLine: { flex: 1, height: 1.5 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotNum: { fontSize: 12, fontWeight: '600' },
  labels: { flexDirection: 'row' },
  label: { flex: 1, fontSize: 11, textAlign: 'center' },
});

export default function CreateScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>('type');
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [type, setType] = useState<SubmissionType>('written');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [location, setLocation] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [fullTestimony, setFullTestimony] = useState('');
  const [identityPreference, setIdentityPreference] = useState<IdentityPreference>('public');
  const [fullName, setFullName] = useState(user?.fullName ?? '');

  // Refs for chaining
  const descRef = useRef<TextInput>(null);
  const locationRef = useRef<TextInput>(null);
  const dateFromRef = useRef<TextInput>(null);
  const dateToRef = useRef<TextInput>(null);

  function next() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }

  function back() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  function validateStep(): string | null {
    if (step === 'event') {
      if (!eventTitle.trim()) return 'Event title is required.';
    }
    if (step === 'testimony') {
      if (type === 'written' && fullTestimony.trim().length < 50)
        return 'Please write at least 50 characters.';
    }
    if (step === 'identity') {
      if (identityPreference === 'public' && !fullName.trim())
        return 'Full name is required for public testimonies.';
    }
    return null;
  }

  function handleNext() {
    const err = validateStep();
    if (err) { Alert.alert('Required', err); return; }
    next();
  }

  async function submit() {
    const err = validateStep();
    if (err) { Alert.alert('Required', err); return; }
    setSubmitting(true);
    try {
      await api.post('/testimonies', {
        submissionType: type,
        identityPreference,
        fullName: identityPreference === 'anonymous' ? 'Anonymous' : fullName.trim(),
        eventTitle: eventTitle.trim(),
        eventDescription: eventDescription.trim() || undefined,
        location: location.trim() || undefined,
        dateOfEventFrom: dateFrom.trim() || undefined,
        dateOfEventTo: dateTo.trim() || undefined,
        fullTestimony: type === 'written' ? fullTestimony.trim() : undefined,
      });
      setStep('done');
    } catch (e: any) {
      Alert.alert('Submission failed', e?.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep('type');
    setEventTitle('');
    setEventDescription('');
    setLocation('');
    setDateFrom('');
    setDateTo('');
    setFullTestimony('');
    setIdentityPreference('public');
    setFullName(user?.fullName ?? '');
  }

  const inputStyle = (active = false) => [
    styles.input,
    { borderColor: active ? theme.ring : theme.border, backgroundColor: theme.card, color: theme.foreground },
  ];

  if (step === 'done') {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.doneState}>
          <View style={[styles.doneIcon, { backgroundColor: theme.secondary }]}>
            <SymbolView name="checkmark.circle.fill" size={56} tintColor={theme.primary} />
          </View>
          <ThemedText style={styles.doneTitle}>Testimony Submitted</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.doneDesc}>
            Thank you for sharing your story. Our team will review it before publishing.
          </ThemedText>
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
            onPress={reset}>
            <ThemedText style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
              Submit Another
            </ThemedText>
          </Pressable>
        </Animated.View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
        {step !== 'type' ? (
          <Pressable onPress={back} style={styles.backBtn} hitSlop={8}>
            <SymbolView name="chevron.left" size={16} tintColor={theme.foreground} />
            <ThemedText style={styles.backText}>Back</ThemedText>
          </Pressable>
        ) : (
          <View style={{ width: 60 }} />
        )}
        <ThemedText style={styles.topBarTitle}>Share Testimony</ThemedText>
        <View style={{ width: 60 }} />
      </View>

      <StepIndicator current={step} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>

          {/* STEP: Type */}
          {step === 'type' && (
            <Animated.View entering={FadeInRight.duration(300)} style={styles.stepBody}>
              <ThemedText style={styles.stepTitle}>What type of testimony?</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.stepSubtitle}>
                Choose how you'd like to share your story.
              </ThemedText>
              <View style={styles.typeOptions}>
                {TYPE_OPTIONS.map(opt => (
                  <Pressable
                    key={opt.type}
                    disabled={!opt.available}
                    style={[
                      styles.typeOption,
                      {
                        borderColor: type === opt.type ? theme.primary : theme.border,
                        backgroundColor: type === opt.type ? theme.secondary : theme.card,
                        opacity: opt.available ? 1 : 0.45,
                      },
                    ]}
                    onPress={() => opt.available && setType(opt.type)}>
                    <View style={[styles.typeOptionIcon, { backgroundColor: type === opt.type ? theme.primary : theme.secondary }]}>
                      <SymbolView
                        name={opt.symbol as any}
                        size={22}
                        tintColor={type === opt.type ? theme.primaryForeground : theme.mutedForeground}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.typeOptionLabel}>{opt.label}</ThemedText>
                      <ThemedText themeColor="textSecondary" style={styles.typeOptionDesc}>
                        {opt.available ? opt.desc : 'Coming soon'}
                      </ThemedText>
                    </View>
                    {type === opt.type && (
                      <SymbolView name="checkmark.circle.fill" size={20} tintColor={theme.primary} />
                    )}
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          )}

          {/* STEP: Event */}
          {step === 'event' && (
            <Animated.View entering={FadeInRight.duration(300)} style={styles.stepBody}>
              <ThemedText style={styles.stepTitle}>About the event</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.stepSubtitle}>
                Tell us about what happened.
              </ThemedText>

              <View style={styles.fieldGroup}>
                <ThemedText style={styles.label}>Event Title *</ThemedText>
                <TextInput
                  style={inputStyle()}
                  placeholder="e.g. Attack on Nyamata village"
                  placeholderTextColor={theme.mutedForeground}
                  value={eventTitle}
                  onChangeText={setEventTitle}
                  returnKeyType="next"
                  onSubmitEditing={() => descRef.current?.focus()}
                />
              </View>

              <View style={styles.fieldGroup}>
                <ThemedText style={styles.label}>Brief Description</ThemedText>
                <TextInput
                  ref={descRef}
                  style={[inputStyle(), styles.multiline]}
                  placeholder="A short description of the event…"
                  placeholderTextColor={theme.mutedForeground}
                  value={eventDescription}
                  onChangeText={setEventDescription}
                  multiline
                  numberOfLines={3}
                  returnKeyType="next"
                  onSubmitEditing={() => locationRef.current?.focus()}
                />
              </View>

              <View style={styles.fieldGroup}>
                <ThemedText style={styles.label}>Location</ThemedText>
                <TextInput
                  ref={locationRef}
                  style={inputStyle()}
                  placeholder="e.g. Nyamata, Bugesera"
                  placeholderTextColor={theme.mutedForeground}
                  value={location}
                  onChangeText={setLocation}
                  returnKeyType="next"
                  onSubmitEditing={() => dateFromRef.current?.focus()}
                />
              </View>

              <View style={styles.dateRow}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <ThemedText style={styles.label}>From (YYYY)</ThemedText>
                  <TextInput
                    ref={dateFromRef}
                    style={inputStyle()}
                    placeholder="1994"
                    placeholderTextColor={theme.mutedForeground}
                    value={dateFrom}
                    onChangeText={setDateFrom}
                    keyboardType="numeric"
                    maxLength={4}
                    returnKeyType="next"
                    onSubmitEditing={() => dateToRef.current?.focus()}
                  />
                </View>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <ThemedText style={styles.label}>To (YYYY)</ThemedText>
                  <TextInput
                    ref={dateToRef}
                    style={inputStyle()}
                    placeholder="1994"
                    placeholderTextColor={theme.mutedForeground}
                    value={dateTo}
                    onChangeText={setDateTo}
                    keyboardType="numeric"
                    maxLength={4}
                    returnKeyType="done"
                  />
                </View>
              </View>
            </Animated.View>
          )}

          {/* STEP: Testimony */}
          {step === 'testimony' && (
            <Animated.View entering={FadeInRight.duration(300)} style={styles.stepBody}>
              <ThemedText style={styles.stepTitle}>Your testimony</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.stepSubtitle}>
                Share your full account of what you witnessed or experienced.
              </ThemedText>
              <View style={styles.fieldGroup}>
                <TextInput
                  style={[
                    inputStyle(),
                    styles.testimonyInput,
                    { textAlignVertical: 'top' },
                  ]}
                  placeholder="Write your testimony here…"
                  placeholderTextColor={theme.mutedForeground}
                  value={fullTestimony}
                  onChangeText={setFullTestimony}
                  multiline
                  autoFocus
                />
                <ThemedText themeColor="textSecondary" style={styles.charCount}>
                  {fullTestimony.length} characters
                </ThemedText>
              </View>
            </Animated.View>
          )}

          {/* STEP: Identity */}
          {step === 'identity' && (
            <Animated.View entering={FadeInRight.duration(300)} style={styles.stepBody}>
              <ThemedText style={styles.stepTitle}>Your identity</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.stepSubtitle}>
                Choose how your name appears on your testimony.
              </ThemedText>

              <View style={styles.identityOptions}>
                {(['public', 'anonymous'] as IdentityPreference[]).map(pref => (
                  <Pressable
                    key={pref}
                    style={[
                      styles.identityOption,
                      {
                        borderColor: identityPreference === pref ? theme.primary : theme.border,
                        backgroundColor: identityPreference === pref ? theme.secondary : theme.card,
                      },
                    ]}
                    onPress={() => setIdentityPreference(pref)}>
                    <SymbolView
                      name={pref === 'public' ? 'person.fill' : 'eye.slash.fill'}
                      size={22}
                      tintColor={identityPreference === pref ? theme.primary : theme.mutedForeground}
                    />
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.identityLabel}>
                        {pref === 'public' ? 'Public' : 'Anonymous'}
                      </ThemedText>
                      <ThemedText themeColor="textSecondary" style={styles.identityDesc}>
                        {pref === 'public'
                          ? 'Your name will be shown'
                          : 'Your identity stays private'}
                      </ThemedText>
                    </View>
                    {identityPreference === pref && (
                      <SymbolView name="checkmark.circle.fill" size={20} tintColor={theme.primary} />
                    )}
                  </Pressable>
                ))}
              </View>

              {identityPreference === 'public' && (
                <Animated.View entering={FadeInDown.duration(250)} style={styles.fieldGroup}>
                  <ThemedText style={styles.label}>Full Name *</ThemedText>
                  <TextInput
                    style={inputStyle()}
                    placeholder="Your full name"
                    placeholderTextColor={theme.mutedForeground}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    returnKeyType="done"
                  />
                </Animated.View>
              )}

              <View style={[styles.noteBox, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                <SymbolView name="info.circle" size={16} tintColor={theme.mutedForeground} />
                <ThemedText themeColor="textSecondary" style={styles.noteText}>
                  All testimonies are reviewed by our team before being published.
                </ThemedText>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom CTA */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: theme.border,
            paddingBottom: insets.bottom + Spacing.two,
            backgroundColor: theme.background,
          },
        ]}>
        {step === 'identity' ? (
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: theme.primary, opacity: submitting ? 0.7 : 1 }]}
            onPress={submit}
            disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color={theme.primaryForeground} />
            ) : (
              <>
                <SymbolView name="paperplane.fill" size={16} tintColor={theme.primaryForeground} />
                <ThemedText style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                  Submit Testimony
                </ThemedText>
              </>
            )}
          </Pressable>
        ) : (
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
            onPress={handleNext}>
            <ThemedText style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
              Continue
            </ThemedText>
            <SymbolView name="arrow.right" size={14} tintColor={theme.primaryForeground} />
          </Pressable>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBarTitle: { fontSize: 16, fontWeight: '600' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 14 },
  scrollContent: { paddingHorizontal: Spacing.four },
  stepBody: { paddingTop: Spacing.four, gap: Spacing.four },
  stepTitle: { fontSize: 22, fontWeight: '700' },
  stepSubtitle: { fontSize: 14, lineHeight: 20, marginTop: -Spacing.two },
  typeOptions: { gap: Spacing.two },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1.5,
    borderRadius: 14,
  },
  typeOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeOptionLabel: { fontSize: 15, fontWeight: '600' },
  typeOptionDesc: { fontSize: 13 },
  fieldGroup: { gap: Spacing.one },
  label: { fontSize: 13, fontWeight: '500' },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
  },
  multiline: { height: 90, paddingTop: Spacing.two },
  dateRow: { flexDirection: 'row', gap: Spacing.two },
  testimonyInput: { height: 240, paddingTop: Spacing.two },
  charCount: { fontSize: 12, textAlign: 'right' },
  identityOptions: { gap: Spacing.two },
  identityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1.5,
    borderRadius: 14,
  },
  identityLabel: { fontSize: 15, fontWeight: '600' },
  identityDesc: { fontSize: 13 },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
  },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18 },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 52,
    borderRadius: 14,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '600' },
  doneState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.six,
    gap: Spacing.four,
  },
  doneIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  doneDesc: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
