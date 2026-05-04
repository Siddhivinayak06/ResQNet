import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, radius } from '../../theme/colors';

// ─── Offline First Aid Data ──────────────────────────────────
interface FirstAidTopic {
  id: string;
  emoji: string;
  title: string;
  tagline: string;
  color: string;
  steps: string[];
  warning?: string;
}

const FIRST_AID_DATA: FirstAidTopic[] = [
  {
    id: 'cpr',
    emoji: '❤️',
    title: 'CPR Instructions',
    tagline: 'Cardiopulmonary Resuscitation',
    color: '#ef4444',
    steps: [
      'Ensure the scene is safe before approaching the victim.',
      'Check for responsiveness — tap shoulders and shout "Are you okay?"',
      'Call emergency services or ask someone nearby to call.',
      'Place the person on a firm, flat surface face-up.',
      'Place the heel of one hand on the center of the chest (between the nipples).',
      'Place your other hand on top, interlocking fingers.',
      'Push hard and fast — at least 2 inches deep, at a rate of 100-120 compressions per minute.',
      'After 30 compressions, tilt the head back, lift the chin, and give 2 rescue breaths.',
      'Continue cycles of 30 compressions and 2 breaths until help arrives.',
    ],
    warning: 'Do NOT stop CPR until professional help arrives or the person begins breathing normally.',
  },
  {
    id: 'bleeding',
    emoji: '🩸',
    title: 'Bleeding Control',
    tagline: 'Severe Wound Management',
    color: '#dc2626',
    steps: [
      'Put on gloves if available to protect yourself.',
      'Apply firm, direct pressure to the wound with a clean cloth or bandage.',
      'Do NOT remove the cloth if blood soaks through — add more layers on top.',
      'If the wound is on a limb, elevate it above the heart if possible.',
      'Apply a pressure bandage if available — wrap snugly but not so tight it cuts off circulation.',
      'For life-threatening bleeding, apply a tourniquet 2-3 inches above the wound (limbs only).',
      'Note the time the tourniquet was applied.',
      'Keep the victim warm and calm. Do NOT give food or water.',
      'Get professional medical help immediately.',
    ],
    warning: 'A tourniquet should only be used as a last resort for life-threatening limb bleeding.',
  },
  {
    id: 'burns',
    emoji: '🔥',
    title: 'Burns Treatment',
    tagline: 'Thermal and Chemical Burns',
    color: '#f59e0b',
    steps: [
      'Remove the person from the source of the burn immediately.',
      'Cool the burn under cool (not cold) running water for at least 10 minutes.',
      'Do NOT apply ice, butter, toothpaste, or home remedies.',
      'Remove clothing and jewelry near the burn (unless stuck to the skin).',
      'Cover the burn loosely with a sterile, non-stick bandage or clean cloth.',
      'For chemical burns, brush off dry chemicals, then rinse with water for 20+ minutes.',
      'Do NOT pop blisters — they protect against infection.',
      'Give over-the-counter pain medication if available.',
      'Seek medical attention for burns larger than 3 inches or on the face, hands, feet, or joints.',
    ],
  },
  {
    id: 'fracture',
    emoji: '🦴',
    title: 'Fracture Handling',
    tagline: 'Broken or Dislocated Bones',
    color: '#3b82f6',
    steps: [
      'Keep the person still — do NOT move the injured area.',
      'Call for emergency medical help.',
      'Immobilize the injury — use a splint or padding to support the limb in its current position.',
      'Do NOT try to realign a bone or push a protruding bone back in.',
      'Apply ice packs wrapped in cloth to reduce swelling (20 min on, 20 min off).',
      'If there is an open fracture (bone through skin), cover the wound with a sterile bandage.',
      'Check circulation below the injury — pulse, skin color, sensation.',
      'Treat for shock if needed — lay the person down, elevate legs, keep warm.',
      'Monitor breathing and consciousness until help arrives.',
    ],
    warning: 'Never attempt to move someone with a suspected spinal injury.',
  },
  {
    id: 'choking',
    emoji: '🫁',
    title: 'Choking Rescue',
    tagline: 'Heimlich Maneuver',
    color: '#8b5cf6',
    steps: [
      'Ask "Are you choking?" — if they cannot speak, cough, or breathe, act immediately.',
      'Stand behind the person and wrap your arms around their waist.',
      'Make a fist with one hand and place it just above the navel (belly button).',
      'Grab your fist with the other hand.',
      'Give quick, upward thrusts into the abdomen.',
      'Repeat until the object is dislodged or the person can breathe.',
      'For infants: place face-down on your forearm, give 5 back blows between shoulder blades, then flip and give 5 chest thrusts.',
      'If the person becomes unconscious, begin CPR and check the mouth for the object before each breath.',
      'Call emergency services immediately.',
    ],
  },
  {
    id: 'heatstroke',
    emoji: '☀️',
    title: 'Heat Stroke',
    tagline: 'Overheating Emergency',
    color: '#ea580c',
    steps: [
      'Move the person to a cool, shaded area immediately.',
      'Call emergency services — heat stroke is life-threatening.',
      'Remove excess clothing.',
      'Cool the person rapidly: apply cold water or ice packs to the neck, armpits, and groin.',
      'Fan the person while misting with water.',
      'Do NOT give fluids if the person is confused or unconscious.',
      'If conscious, give small sips of cool water.',
      'Monitor body temperature — aim to bring it below 39°C (102°F).',
      'Stay with the person until medical help arrives.',
    ],
    warning: 'Heat stroke can cause organ damage or death if not treated within minutes.',
  },
];

export default function FirstAidGuideScreen() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🏥 First Aid Guide</Text>
          <Text style={styles.subtitle}>Offline emergency reference — always available</Text>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ This guide is for reference only. Always call emergency services for serious injuries.
          </Text>
        </View>

        {/* Topics */}
        {FIRST_AID_DATA.map((topic) => {
          const isOpen = expanded === topic.id;
          return (
            <TouchableOpacity
              key={topic.id}
              onPress={() => setExpanded(isOpen ? null : topic.id)}
              activeOpacity={0.8}
              style={styles.card}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: `${topic.color}20` }]}>
                  <Text style={{ fontSize: 24 }}>{topic.emoji}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.cardTitle}>{topic.title}</Text>
                  <Text style={styles.cardTagline}>{topic.tagline}</Text>
                </View>
                <Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
              </View>

              {/* Steps (expanded) */}
              {isOpen && (
                <View style={styles.stepsContainer}>
                  {topic.steps.map((step, i) => (
                    <View key={i} style={styles.stepRow}>
                      <View style={[styles.stepBadge, { backgroundColor: `${topic.color}20` }]}>
                        <Text style={[styles.stepNum, { color: topic.color }]}>{i + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                  {topic.warning && (
                    <View style={styles.warningBox}>
                      <Text style={styles.warningText}>⚠️ {topic.warning}</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark950 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16 },

  header: { marginBottom: 16 },
  title: { color: colors.white, fontSize: 26, fontWeight: 'bold' },
  subtitle: { color: colors.dark400, fontSize: 13, marginTop: 4 },

  disclaimer: {
    backgroundColor: 'rgba(234,179,8,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(234,179,8,0.3)',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 16,
  },
  disclaimerText: { color: '#fbbf24', fontSize: 12, lineHeight: 18 },

  card: {
    backgroundColor: colors.dark900,
    borderWidth: 1,
    borderColor: colors.dark700,
    borderRadius: radius.xl,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  cardTagline: { color: colors.dark400, fontSize: 12, marginTop: 2 },
  chevron: { color: colors.dark500, fontSize: 12 },

  stepsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.dark800,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  stepNum: { fontSize: 12, fontWeight: 'bold' },
  stepText: { flex: 1, color: colors.dark200, fontSize: 14, lineHeight: 20 },

  warningBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: radius.md,
    padding: 12,
    marginTop: 4,
  },
  warningText: { color: colors.primary300, fontSize: 12, lineHeight: 18 },
});
