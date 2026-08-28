import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function OfflineBanner() {
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={16} color="#fbbf24" />
      <Text style={styles.text}>You&apos;re offline — saved stories are still available</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  text: {
    color: '#fbbf24',
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
  },
});
