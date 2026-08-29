import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { BeforeAfterCase } from '../types';
import { Colors, Shadows } from '../constants/theme';
import { useApp } from '../context/AppContext';

interface BeforeAfterSliderProps {
  item: BeforeAfterCase;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ item }) => {
  const { language } = useApp();
  const [showAfter, setShowAfter] = useState(true);

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: showAfter ? item.afterImageUrl : item.beforeImageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Toggle Badges */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            onPress={() => setShowAfter(false)}
            style={[styles.toggleBtn, !showAfter && styles.toggleBtnActive]}
          >
            <Text
              style={[
                styles.toggleText,
                !showAfter && styles.toggleTextActive,
              ]}
            >
              {language === 'ar' ? 'قبل العلاج' : 'Before'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowAfter(true)}
            style={[styles.toggleBtn, showAfter && styles.toggleBtnActive]}
          >
            <Text
              style={[
                styles.toggleText,
                showAfter && styles.toggleTextActive,
              ]}
            >
              {language === 'ar' ? 'بعد العلاج ✨' : 'After ✨'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {language === 'ar' ? item.categoryAr : item.categoryEn}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {language === 'ar' ? item.titleAr : item.titleEn}
        </Text>
        <Text style={styles.desc}>
          {language === 'ar' ? item.descriptionAr : item.descriptionEn}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.doctor}>{item.dentistName}</Text>
          <Text style={styles.duration}>
            {language === 'ar'
              ? `مدة الخطة: ${item.durationWeeks} أسابيع`
              : `Duration: ${item.durationWeeks} weeks`}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 16,
    ...Shadows.md,
  },
  imageContainer: {
    position: 'relative',
    height: 190,
    width: '100%',
    backgroundColor: '#0f172a',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  toggleRow: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 24,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  toggleTextActive: {
    color: Colors.white,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(13, 148, 136, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  desc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  doctor: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  duration: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
