import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../theme/colors';
import { typography, shared } from '../../theme/styles';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}
const FadeInView = ({ children, delay = 0, style, down = false }: any) => {
  const anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [down ? -20 : 20, 0],
  });

  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

// ─── Offline First Aid Data ───
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
  { id: 'cpr', emoji: '❤️', title: 'CPR Instructions', tagline: 'Cardiopulmonary Resuscitation', color: colors.danger, steps: ['Ensure the scene is safe before approaching the victim.', 'Check for responsiveness — tap shoulders and shout "Are you okay?"', 'Call emergency services or ask someone nearby to call.', 'Place the person on a firm, flat surface face-up.', 'Push hard and fast — at least 2 inches deep, 100-120 per minute.', 'After 30 compressions, give 2 rescue breaths.', 'Continue cycles until help arrives.'], warning: 'Do NOT stop CPR until professional help arrives.' },
  { id: 'bleeding', emoji: '🩸', title: 'Bleeding Control', tagline: 'Severe Wound Management', color: colors.primary600, steps: ['Put on gloves if available.', 'Apply firm, direct pressure with a clean cloth.', 'Do NOT remove cloth if blood soaks through — add more layers.', 'Elevate wound above heart if possible.', 'Apply tourniquet 2-3 inches above wound (limbs only) for severe cases.', 'Get medical help immediately.'], warning: 'Tourniquets are a last resort for life-threatening limb bleeding.' },
  { id: 'burns', emoji: '🔥', title: 'Burns Treatment', tagline: 'Thermal and Chemical Burns', color: colors.warning, steps: ['Remove person from source of burn immediately.', 'Cool burn under cool running water for at least 10 minutes.', 'Do NOT apply ice, butter, or toothpaste.', 'Cover loosely with a sterile, non-stick bandage.', 'Do NOT pop blisters.'], warning: 'Seek medical attention for burns larger than 3 inches.' },
  { id: 'fracture', emoji: '🦴', title: 'Fracture Handling', tagline: 'Broken or Dislocated Bones', color: colors.info, steps: ['Keep the person still — do NOT move the injured area.', 'Call for emergency medical help.', 'Immobilize the injury — use a splint or padding.', 'Do NOT try to realign a bone.', 'Apply ice packs wrapped in cloth.'], warning: 'Never attempt to move someone with a suspected spinal injury.' },
  { id: 'choking', emoji: '🫁', title: 'Choking Rescue', tagline: 'Heimlich Maneuver', color: colors.purple, steps: ['Ask "Are you choking?"', 'Stand behind person and wrap arms around waist.', 'Make a fist just above the navel.', 'Grab fist with other hand and give quick upward thrusts.', 'Repeat until object is dislodged.'], warning: 'Call emergency services immediately.' },
  { id: 'heatstroke', emoji: '☀️', title: 'Heat Stroke', tagline: 'Overheating Emergency', color: '#ea580c', steps: ['Move person to a cool, shaded area immediately.', 'Call emergency services.', 'Cool person rapidly with cold water or ice packs.', 'Fan the person.', 'Do NOT give fluids if confused or unconscious.'], warning: 'Heat stroke can cause organ damage or death within minutes.' },
];

export default function FirstAidGuideScreen() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(expanded === id ? null : id);
  };

  return (
    <SafeAreaView style={shared.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <FadeInView down delay={0} style={styles.header}>
          <Text style={typography.h1}>🏥 First Aid</Text>
          <Text style={styles.subtitle}>Offline emergency reference</Text>
        </FadeInView>

        <FadeInView delay={100} style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ This guide is for reference only. Always call emergency services for serious injuries.
          </Text>
        </FadeInView>

        {FIRST_AID_DATA.map((topic, index) => {
          const isOpen = expanded === topic.id;
          return (
            <FadeInView key={topic.id} delay={150 + index * 50}>
              <TouchableOpacity
                onPress={() => toggleExpand(topic.id)}
                activeOpacity={0.8}
                style={[styles.card, isOpen && { borderColor: topic.color }]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: `${topic.color}20` }]}>
                    <Text style={{ fontSize: 24 }}>{topic.emoji}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={typography.h4}>{topic.title}</Text>
                    <Text style={styles.cardTagline}>{topic.tagline}</Text>
                  </View>
                  <Text style={{ color: colors.dark500, fontSize: 16 }}>{isOpen ? '▲' : '▼'}</Text>
                </View>

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
            </FadeInView>
          );
        })}

        <View style={{ height: spacing['4xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  header: { marginBottom: spacing.lg },
  subtitle: { color: colors.dark400, fontSize: 14, marginTop: spacing.xs, fontWeight: '500' },

  disclaimer: {
    backgroundColor: 'rgba(234,179,8,0.1)',
    borderWidth: 1, borderColor: 'rgba(234,179,8,0.3)',
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xl,
  },
  disclaimerText: { color: '#fbbf24', fontSize: 13, lineHeight: 18, fontWeight: '600' },

  card: { ...shared.cardGlass, marginBottom: spacing.md, padding: spacing.lg, borderRadius: radius.xl },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cardTagline: { color: colors.dark400, fontSize: 12, marginTop: 2, fontWeight: '500' },

  stepsContainer: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.dark800 },
  stepRow: { flexDirection: 'row', marginBottom: spacing.md, alignItems: 'flex-start' },
  stepBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  stepNum: { fontSize: 13, fontWeight: '900' },
  stepText: { flex: 1, color: colors.dark200, fontSize: 14, lineHeight: 22 },

  warningBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  warningText: { color: colors.primary300, fontSize: 13, lineHeight: 18, fontWeight: '600' },
});
