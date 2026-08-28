import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import type { EarnedBadge } from '@/constants/types';
import type { BadgeDefinition } from '@/lib/badges';

interface BadgeCardProps {
  definition: BadgeDefinition;
  earned?: EarnedBadge;
  progress: { current: number; target: number };
  index: number;
}

const BADGE_GRADIENTS: [string, string][] = [
  ["rgba(100,103,242,0.4)", "rgba(147,51,234,0.4)"],
  ["rgba(59,130,246,0.4)", "rgba(99,102,241,0.4)"],
  ["rgba(249,115,22,0.4)", "rgba(239,68,68,0.4)"],
  ["rgba(16,185,129,0.4)", "rgba(6,182,212,0.4)"],
  ["rgba(236,72,153,0.4)", "rgba(168,85,247,0.4)"],
  ["rgba(245,158,11,0.4)", "rgba(239,68,68,0.4)"],
];

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function BadgeCard({ definition, earned, progress, index }: BadgeCardProps) {
  const isEarned = !!earned;
  const currentProgress = isEarned ? progress.target : progress.current;
  const ratio = progress.target > 0 ? Math.min(currentProgress / progress.target, 1) : 0;
  const pct = Math.round(ratio * 100);

  if (isEarned) {
    return (
      <View style={styles.badgeCard} testID={`badge-${definition.id}-earned`}>
        <View style={[styles.badgeCircle, { backgroundColor: "transparent" }]}>
          <LinearGradient
            colors={BADGE_GRADIENTS[index % BADGE_GRADIENTS.length]}
            style={styles.badgeCircleGradient}
          >
            <Text style={styles.badgeEmoji}>{definition.emoji}</Text>
          </LinearGradient>
          <View style={styles.badgeCircleRing} />
        </View>
        <Text style={styles.badgeTitle}>{definition.title}</Text>
        <Text style={styles.badgeDesc}>{definition.description}</Text>
        <Text style={styles.earnedDate}>Earned: {formatDate(earned.earnedAt)}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badgeCard, styles.badgeCardLocked]} testID={`badge-${definition.id}-locked`}>
      <View style={styles.lockedCircle}>
        <Text style={styles.lockedEmoji}>{definition.emoji}</Text>
      </View>
      <Text style={[styles.badgeTitle, styles.lockedTitle]}>
        {definition.title}
      </Text>
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentProgress}/{progress.target}
        </Text>
      </View>
      
      <Text style={styles.hintText}>{definition.hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeCard: {
    width: "100%",
    alignItems: "center",
    gap: 6,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(100,103,242,0.05)",
    borderWidth: 1,
    borderColor: "rgba(100,103,242,0.2)",
  },
  badgeCardLocked: {
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  badgeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  badgeCircleGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeCircleRing: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: "rgba(100,103,242,0.25)",
  },
  badgeEmoji: { fontSize: 38 },
  badgeTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
  },
  badgeDesc: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 15,
  },
  earnedDate: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 9,
    color: "rgba(100,103,242,0.85)",
    marginTop: 4,
    textAlign: "center",
  },
  lockedCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(30,30,50,0.5)",
    borderWidth: 2,
    borderColor: "rgba(100,100,140,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  lockedEmoji: {
    fontSize: 38,
    opacity: 0.35,
  },
  lockedTitle: {
    color: "rgba(255,255,255,0.4)",
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  progressText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  hintText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
    lineHeight: 14,
    marginTop: 2,
  },
});
