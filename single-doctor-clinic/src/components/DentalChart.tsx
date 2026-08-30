import React, { useState, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
            width: isMolar ? 36 : isPremolar ? 32 : isCanine ? 30 : 28,
            height: 48,
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
          {isMolar ? 'ط·ط§ط­ظ†' : isPremolar ? 'ط¶ط§ط­ظƒ' : isCanine ? 'ظ†ط§ط¨' : 'ظ‚ط§ط·ط¹'}
        </Text>
        <View
          style={[
            styles.toothCusp,
            {
              backgroundColor: isSelected
                ? 'rgba(255,255,255,0.8)'
                : Colors.border,
            },
          ]}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
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
            â¬†ï¸ڈ {language === 'ar' ? 'ط§ظ„ظپظƒ ط§ظ„ط¹ظ„ظˆظٹ (Upper)' : 'Upper Jaw'}
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
            â¬‡ï¸ڈ {language === 'ar' ? 'ط§ظ„ظپظƒ ط§ظ„ط³ظپظ„ظٹ (Lower)' : 'Lower Jaw'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Anatomical Model Box */}
      <View style={styles.archBox}>
        <View style={styles.directionHeader}>
          <Text style={styles.directionText}>ًں‘‰ ظٹظ…ظٹظ† ط§ظ„ظ…ط±ظٹط¶</Text>
          <Text style={styles.archTitle}>
            {activeJaw === 'upper' ? 'ظ‚ظˆط³ ط§ظ„ظپظƒ ط§ظ„ط¹ظ„ظˆظٹ ط§ظ„طھط´ط±ظٹط­ظٹ' : 'ظ‚ظˆط³ ط§ظ„ظپظƒ ط§ظ„ط³ظپظ„ظٹ ط§ظ„طھط´ط±ظٹط­ظٹ'}
          </Text>
          <Text style={styles.directionText}>ظٹط³ط§ط± ط§ظ„ظ…ط±ظٹط¶ ًں‘ˆ</Text>
        </View>

        {/* 1. Front Incisors Row (ط§ظ„ط£ط³ظ†ط§ظ† ط§ظ„ط£ظ…ط§ظ…ظٹط©) */}
        <View style={styles.clusterTitleBox}>
          <Text style={styles.clusterTitleText}>ط§ظ„ظ‚ظˆط§ط·ط¹ ظˆط§ظ„ط£ط³ظ†ط§ظ† ط§ظ„ط£ظ…ط§ظ…ظٹط©</Text>
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

        {/* 2. Canines & Premolars Row (ط§ظ„ط£ظ†ظٹط§ط¨ ظˆط§ظ„ط¶ظˆط§ط­ظƒ) */}
        <View style={styles.clusterTitleBox}>
          <Text style={styles.clusterTitleText}>ط§ظ„ط£ظ†ظٹط§ط¨ ظˆط§ظ„ط¶ظˆط§ط­ظƒ ط§ظ„ط¬ط§ظ†ط¨ظٹط©</Text>
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

        {/* 3. Molars & Wisdom Row (ط§ظ„ط¶ط±ظˆط³ ط§ظ„ط®ظ„ظپظٹط© ظˆط¶ط±ط³ ط§ظ„ط¹ظ‚ظ„) */}
        <View style={styles.clusterTitleBox}>
          <Text style={styles.clusterTitleText}>ط§ظ„ط¶ط±ظˆط³ ط§ظ„ط®ظ„ظپظٹط© ظˆط¶ط±ط³ ط§ظ„ط¹ظ‚ظ„</Text>
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
          <Text style={styles.selectedTitle}>ط§ظ„ط£ط³ظ†ط§ظ† ط§ظ„ظ…ط­ط¯ط¯ط© ظپظٹ ط§ظ„ظ…ط¬ط³ظ…:</Text>
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
    marginVertical: 6,
  },
  jawTabs: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginBottom: 10,
  },
  jawTabBtn: {
    flex: 1,
    paddingVertical: 8,
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
    color: '#64748b',
  },
  jawTabBtnTextActive: {
    color: Colors.primary,
  },
  archBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  toothLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  directionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  directionText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  archTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  clusterTitleBox: {
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
  },
  clusterTitleText: {
    fontSize: 9,
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
    borderColor: Colors.borderDark,
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
    fontSize: 7,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  toothTypeLabelSelected: {
    color: 'rgba(255,255,255,0.85)',
  },
  toothCusp: {
    width: 12,
    height: 3,
    borderRadius: 2,
  },
  midline: {
    width: 2,
    height: 40,
    backgroundColor: Colors.primary,
    marginHorizontal: 4,
    borderRadius: 1,
  },
  selectedContainer: {
    marginTop: 10,
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
