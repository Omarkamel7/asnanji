import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Stethoscope } from 'lucide-react-native';
import { Colors } from '../constants/theme';

interface DoctorAvatarProps {
  avatarUrl?: string | null;
  name?: string;
  size?: number;
  showBadge?: boolean;
  style?: any;
}

export const DoctorAvatar: React.FC<DoctorAvatarProps> = ({
  avatarUrl,
  name,
  size = 50,
  showBadge = false,
  style,
}) => {
  const initial = name ? name.replace(/^د[\.\s]+/, '').trim().charAt(0) : '';

  if (avatarUrl && avatarUrl.startsWith('http')) {
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}>
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        {showBadge && <View style={[styles.onlineBadge, { width: size * 0.28, height: size * 0.28, borderRadius: (size * 0.28) / 2 }]} />}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.fallbackContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      {initial ? (
        <Text style={[styles.initialText, { fontSize: size * 0.44 }]}>{initial}</Text>
      ) : (
        <Stethoscope size={size * 0.52} color={Colors.white} />
      )}
      {showBadge && <View style={[styles.onlineBadge, { width: size * 0.28, height: size * 0.28, borderRadius: (size * 0.28) / 2 }]} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  fallbackContainer: {
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#E0F2FE',
  },
  initialText: {
    color: Colors.white,
    fontWeight: '800',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: Colors.white,
  },
});
