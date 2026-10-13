import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { FDI_TEETH } from '../constants/dentalData';
import { ToothInfo } from '../types';
import { Colors, Shadows } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { lightTap } from '../utils/haptics';

const FDI_MAP = new Map<number, ToothInfo>(FDI_TEETH.map((t) => [t.fdiNumber, t]));

interface DentalChartProps {
  selectedTeeth: number[];
  onToggleTooth: (fdiNumber: number) => void;
  readOnly?: boolean;
  highlightedTeeth?: number[];
}

export const DentalChartComponent: React.FC<DentalChartProps> = ({
  selectedTeeth,
  onToggleTooth,
  readOnly = false,
  highlightedTeeth = [],
}) => {
  const { language } = useApp();
  const [activeJaw, setActiveJaw] = useState<'upper' | 'lower'>('upper');

  const renderToothButton = (toothNum: number) => {
    const isSelected = selectedTeeth.includes(toothNum);
    const toothInfo = FDI_MAP.get(toothNum);
    const isMolar = toothInfo?.type === 'molar' || toothInfo?.type === 'wisdom';
    const isPremolar = toothInfo?.type === 'premolar';
    const isCanine = toothInfo?.type === 'canine';

    return (
      <TouchableOpacity
        key={toothNum}
        disabled={readOnly}
        onPress={() => {
          lightTap();
          onToggleTooth(toothNum);
        }}
        style={[
          styles.toothButton,
          {
            width: isMolar ? 38 : isPremolar ? 33 : isCanine ? 30 : 28,
            height: 52,
            borderRadius: isMolar ? 10 : isCanine ? 12 : 6,
          },
          isSelected && styles.toothButtonSelected,
        ]}
        activeOpacity={0.7}
      >
        <Text style={[styles.toothNumber, isSelected && styles.toothNumberSelected]}>
          {toothNum}
        </Text>
        <Text style={[styles.toothTypeLabel, isSelected && styles.toothTypeLabelSelected]}>
          {toothInfo?.type === 'wisdom'
            ? language === 'ar' ? 'عقل' : 'Wis'
            : isMolar
            ? language === 'ar' ? 'ضرس' : 'Mol'
            : isPremolar
            ? language === 'ar' ? 'ضاحك' : 'Pre'
            : isCanine
            ? language === 'ar' ? 'ناب' : 'Can'
            : language === 'ar' ? 'قاطع' : 'Inc'}
        </Text>
        <View
          style={[
            styles.toothCusp,
            {
              backgroundColor: isSelected
                ? 'rgba(255,255,255,0.9)'
                : Colors.border,
            },
          ]}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 3D Realistic Dental Arch Reference Banner */}
      <View style={styles.modelBannerCard}>
        <Image
          source={require('../../assets/dental_model_reference.jpg')}
          style={styles.modelImage}
          contentFit="cover"
        />
        <View style={styles.modelOverlayBadge}>
          <Text style={styles.modelBadgeText}>
            {language === 'ar' ? 'مجسم الأسنان التشريحي 3D (1 - 32)' : '3D Dental Anatomy Model (1 - 32)'}
          </Text>
        </View>
      </View>

      {/* Jaw Switcher Tabs */}
      <View style={styles.jawTabs}>
        <TouchableOpacity
          onPress={() => setActiveJaw('upper')}
          style={[styles.jawTabBtn, activeJaw === 'upper' && styles.jawTabBtnActive]}
        >
          <Text
            style={[
              styles.jawTabBtnText,
              activeJaw === 'upper' && styles.jawTabBtnTextActive,
            ]}
          >
            ⬆️ {language === 'ar' ? 'الفك العلوي (Upper Arch)' : 'Upper Arch'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveJaw('lower')}
          style={[styles.jawTabBtn, activeJaw === 'lower' && styles.jawTabBtnActive]}
        >
          <Text
            style={[
              styles.jawTabBtnText,
              activeJaw === 'lower' && styles.jawTabBtnTextActive,
            ]}
          >
            ⬇️ {language === 'ar' ? 'الفك السفلي (Lower Arch)' : 'Lower Arch'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Anatomical Selection Arch Box */}
      <View style={styles.archBox}>
        <View style={styles.directionHeader}>
          <Text style={styles.directionText}>👉 {language === 'ar' ? 'يمين المريض' : 'Right'}</Text>
          <Text style={styles.archTitle}>
            {activeJaw === 'upper'
              ? language === 'ar' ? 'قوس الفك العلوي الطبي' : 'Maxillary Upper Arch'
              : language === 'ar' ? 'قوس الفك السفلي الطبي' : 'Mandibular Lower Arch'}
          </Text>
          <Text style={styles.directionText}>{language === 'ar' ? 'يسار المريض' : 'Left'} 👈</Text>
        </View>

        {/* 1. Front Incisors Row */}
        <View style={styles.clusterTitleBox}>
          <Text style={styles.clusterTitleText}>
            {language === 'ar' ? 'القواطع والأسنان الأمامية' : 'Incisors & Anterior Teeth'}
          </Text>
        </View>
        <View style={styles.teethClusterRow}>
          {activeJaw === 'upper' ? (
            <>
              {renderToothButton(12)}
              {renderToothButton(11)}
              <View style={styles.midline} />
              {renderToothButton(21)}
              {renderToothButton(22)}
            </>
          ) : (
            <>
              {renderToothButton(42)}
              {renderToothButton(41)}
              <View style={styles.midline} />
              {renderToothButton(31)}
              {renderToothButton(32)}
            </>
          )}
        </View>

        {/* 2. Canines & Premolars Row */}
        <View style={styles.clusterTitleBox}>
          <Text style={styles.clusterTitleText}>
            {language === 'ar' ? 'الأنياب والضواحك الجانبية' : 'Canines & Premolars'}
          </Text>
        </View>
        <View style={styles.teethClusterRow}>
          {activeJaw === 'upper' ? (
            <>
              {renderToothButton(15)}
              {renderToothButton(14)}
              {renderToothButton(13)}
              <View style={{ width: 10 }} />
              {renderToothButton(23)}
              {renderToothButton(24)}
              {renderToothButton(25)}
            </>
          ) : (
            <>
              {renderToothButton(45)}
              {renderToothButton(44)}
              {renderToothButton(43)}
              <View style={{ width: 10 }} />
              {renderToothButton(33)}
              {renderToothButton(34)}
              {renderToothButton(35)}
            </>
          )}
        </View>

        {/* 3. Molars & Wisdom Row */}
        <View style={styles.clusterTitleBox}>
          <Text style={styles.clusterTitleText}>
            {language === 'ar' ? 'الضروس الخلفية وضرس العقل' : 'Molars & Wisdom Teeth'}
          </Text>
        </View>
        <View style={styles.teethClusterRow}>
          {activeJaw === 'upper' ? (
            <>
              {renderToothButton(18)}
              {renderToothButton(17)}
              {renderToothButton(16)}
              <View style={{ width: 10 }} />
              {renderToothButton(26)}
              {renderToothButton(27)}
              {renderToothButton(28)}
            </>
          ) : (
            <>
              {renderToothButton(48)}
              {renderToothButton(47)}
              {renderToothButton(46)}
              <View style={{ width: 10 }} />
              {renderToothButton(36)}
              {renderToothButton(37)}
              {renderToothButton(38)}
            </>
          )}
        </View>
      </View>

      {/* Selected Teeth Badges */}
      {selectedTeeth.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedTitle}>
            {language === 'ar' ? 'الأسنان المحددة في المجسم:' : 'Selected Teeth:'}
          </Text>
          <View style={styles.tagsContainer}>
            {selectedTeeth.map((num) => {
              const info = FDI_TEETH.find((t) => t.fdiNumber === num);
              return (
                <View key={num} style={styles.selectedTag}>
                  <Text style={styles.tagNum}>#{num}</Text>
                  <Text style={styles.tagName}>
                    {language === 'ar' ? info?.nameAr : info?.nameEn}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  modelBannerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 120,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  modelImage: {
    width: '100%',
    height: '100%',
  },
  modelOverlayBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modelBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  jawTabs: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginBottom: 10,
  },
  jawTabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  jawTabBtnActive: {
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  jawTabBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  jawTabBtnTextActive: {
    color: Colors.primary,
  },
  archBox: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  directionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 6,
  },
  directionText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  archTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  clusterTitleBox: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  clusterTitleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  teethClusterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  toothButton: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    ...Shadows.sm,
  },
  toothButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
    transform: [{ scale: 1.08 }],
    ...Shadows.md,
  },
  toothNumber: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  toothNumberSelected: {
    color: Colors.white,
  },
  toothTypeLabel: {
    fontSize: 7.5,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  toothTypeLabelSelected: {
    color: 'rgba(255,255,255,0.9)',
  },
  toothCusp: {
    width: 12,
    height: 3,
    borderRadius: 2,
  },
  midline: {
    width: 2,
    height: 42,
    backgroundColor: Colors.primary,
    marginHorizontal: 4,
    borderRadius: 1,
  },
  selectedContainer: {
    marginTop: 12,
    paddingTop: 8,
  },
  selectedTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  tagNum: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  tagName: {
    fontSize: 11,
    color: Colors.textPrimary,
  },
});

export default React.memo(DentalChartComponent);
