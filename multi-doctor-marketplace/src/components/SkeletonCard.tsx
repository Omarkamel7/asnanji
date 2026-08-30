import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/theme';

interface SkeletonCardProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: any;
}

export const SkeletonCard = ({ width = '100%', height = 100, borderRadius = 8, style }: SkeletonCardProps) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300], // Adjust based on screen width/expected max width
  });

  return (
    <View style={[{ width, height, borderRadius, backgroundColor: Colors.border, overflow: 'hidden' }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={[Colors.border, Colors.surface, Colors.border]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

export const SkeletonServiceCard = () => {
  return (
    <View style={styles.serviceCard}>
      <SkeletonCard width={60} height={60} borderRadius={30} style={styles.marginBottom} />
      <SkeletonCard width="80%" height={20} borderRadius={4} style={styles.marginBottom} />
      <SkeletonCard width="60%" height={16} borderRadius={4} style={styles.marginBottom} />
      <SkeletonCard width="40%" height={24} borderRadius={4} />
    </View>
  );
};

export const SkeletonChatBubble = ({ isRight = false }: { isRight?: boolean }) => {
  return (
    <View style={[styles.chatBubble, isRight ? styles.chatBubbleRight : styles.chatBubbleLeft]}>
      <SkeletonCard width={isRight ? '70%' : '50%'} height={36} borderRadius={18} />
    </View>
  );
};

export const SkeletonConsultationCard = () => {
  return (
    <View style={styles.consultationCard}>
      <SkeletonCard width={50} height={50} borderRadius={25} style={styles.marginRight} />
      <View style={styles.flex1}>
        <SkeletonCard width="90%" height={20} borderRadius={4} style={styles.marginBottom} />
        <SkeletonCard width="100%" height={16} borderRadius={4} style={styles.marginBottom} />
        <SkeletonCard width="70%" height={16} borderRadius={4} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  serviceCard: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginBottom: 16,
  },
  chatBubble: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  chatBubbleLeft: {
    justifyContent: 'flex-start',
  },
  chatBubbleRight: {
    justifyContent: 'flex-end',
  },
  consultationCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  marginBottom: {
    marginBottom: 8,
  },
  marginRight: {
    marginRight: 12,
  },
  flex1: {
    flex: 1,
  },
});
