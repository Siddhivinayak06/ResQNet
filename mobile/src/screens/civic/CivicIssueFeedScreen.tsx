import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { civicIssueService, CivicIssue } from '../../services/civicIssueService';
import { colors, radius, spacing } from '../../theme/colors';
import { typography, shared } from '../../theme/styles';

type Props = NativeStackScreenProps<any, 'CivicFeed'>;

const FadeInView = ({ children, delay = 0 }: any) => {
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
    outputRange: [20, 0],
  });

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

const CATEGORY_EMOJI: Record<string, string> = {
  pothole: '🕳️', garbage: '🗑️', water_leakage: '💧', streetlight: '💡',
  damaged_road: '🚧', fallen_tree: '🌳', illegal_dumping: '♻️', other: '📋'
};

const STATUS_COLOR: Record<string, string> = {
  reported: colors.blue500,
  under_review: colors.amber500,
  assigned: colors.amber500,
  in_progress: colors.warning,
  resolved: colors.success,
  closed: colors.dark400
};

export default function CivicIssueFeedScreen({ navigation }: Props) {
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIssues = useCallback(async () => {
    try {
      const data = await civicIssueService.getCivicIssues();
      setIssues(data);
    } catch (err) {
      console.log('Error fetching civic issues', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchIssues();
  };

  const renderItem = ({ item, index }: { item: CivicIssue; index: number }) => {
    const emoji = CATEGORY_EMOJI[item.category] || '📋';
    const sColor = STATUS_COLOR[item.status] || colors.dark400;

    return (
      <FadeInView delay={index * 50}>
        <TouchableOpacity style={styles.card} activeOpacity={0.7}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconBox, { backgroundColor: `${colors.blue500}20` }]}>
                <Text style={{ fontSize: 24 }}>{emoji}</Text>
              </View>
              <View style={{ marginLeft: spacing.sm }}>
                <Text style={styles.cardTitle}>{item.category.replace('_', ' ').toUpperCase()}</Text>
                <Text style={styles.cardDate}>{new Date(item.reportedAt).toLocaleDateString()}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${sColor}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: sColor }]} />
              <Text style={[styles.statusText, { color: sColor }]}>{item.status.replace('_', ' ').toUpperCase()}</Text>
            </View>
          </View>
          
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          
          <View style={styles.cardFooter}>
            <View style={styles.footerItem}>
              <Text style={{ fontSize: 14 }}>💬</Text>
              <Text style={styles.footerText}>{item.comments?.length || 0}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </FadeInView>
    );
  };

  return (
    <SafeAreaView style={shared.screen}>
      <View style={styles.header}>
        <Text style={typography.h1}>🏙️ Civic Issues</Text>
        <Text style={[typography.bodySmall, { marginTop: spacing.xs }]}>Community reported civic issues.</Text>
      </View>

      <FlatList
        data={issues}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue500} />}
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: 'center', marginTop: 100 }}>
              <Text style={{ fontSize: 40, marginBottom: spacing.md }}>🌱</Text>
              <Text style={typography.h3}>No civic issues</Text>
              <Text style={typography.caption}>Your city is looking great!</Text>
            </View>
          ) : (
            <ActivityIndicator size="large" color={colors.blue500} style={{ marginTop: 100 }} />
          )
        }
      />
      
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('ReportCivicIssue')}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 24, color: 'white', fontWeight: 'bold' }}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg },
  
  card: {
    ...shared.cardGlass,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  cardDate: { color: colors.dark400, fontSize: 12, marginTop: 2 },
  
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  
  cardDesc: { color: colors.dark300, fontSize: 14, lineHeight: 20, marginBottom: spacing.sm },
  
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.dark800,
    paddingTop: spacing.sm,
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.md },
  footerText: { color: colors.dark400, fontSize: 12, fontWeight: '600', marginLeft: 4 },
  
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.blue600,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  }
});
