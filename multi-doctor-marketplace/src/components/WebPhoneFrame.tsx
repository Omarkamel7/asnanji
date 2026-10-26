import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions, Text, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';

interface WebPhoneFrameProps {
  children: React.ReactNode;
}

export const WebPhoneFrame: React.FC<WebPhoneFrameProps> = ({ children }) => {
  const { width, height } = useWindowDimensions();
  const { role, simulateUserMode } = useApp();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'asnanji-web-frame-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          html, body, #root {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background-color: #090d16 !important;
            overflow: hidden !important;
          }
          * {
            box-sizing: border-box;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  const switchToDoctor = async () => {
    await simulateUserMode('doctor');
  };

  const switchToPatient = async () => {
    await simulateUserMode('patient');
  };

  const switchToAdmin = async () => {
    await simulateUserMode('admin');
  };

  // On native mobile devices (Android/iOS) or narrow web screens, render normally
  if (Platform.OS !== 'web' || width <= 480) {
    return <View style={styles.nativeRoot}>{children}</View>;
  }

  // Calculate phone frame dimensions (standard modern 20:9 smartphone ratio)
  const phoneWidth = 412;
  const phoneHeight = Math.min(880, Math.max(680, height - 80));

  return (
    <View style={styles.webBackdrop}>
      {/* Interactive Role Switcher Toolbar for Web Preview */}
      <View style={styles.webRoleToolbar}>
        <View style={styles.webHeaderBadge}>
          <Text style={styles.webHeaderBadgeText}>📱 معاينة اسنانجي الحية</Text>
        </View>

        <View style={styles.roleTabsRow}>
          <TouchableOpacity
            style={[styles.roleTabBtn, role === 'patient' && styles.roleTabBtnActive]}
            onPress={switchToPatient}
          >
            <Text style={[styles.roleTabBtnText, role === 'patient' && styles.roleTabBtnTextActive]}>
              👤 حساب المريض
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTabBtn, role === 'doctor' && styles.roleTabBtnActive]}
            onPress={switchToDoctor}
          >
            <Text style={[styles.roleTabBtnText, role === 'doctor' && styles.roleTabBtnTextActive]}>
              👨‍⚕️ حساب الطبيب
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTabBtn, role === 'admin' && styles.roleTabBtnActive]}
            onPress={switchToAdmin}
          >
            <Text style={[styles.roleTabBtnText, role === 'admin' && styles.roleTabBtnTextActive]}>
              🛡️ لوحة الأدمن
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Phone Hardware Mockup Frame */}
      <View
        style={[
          styles.phoneFrame,
          {
            width: phoneWidth,
            height: phoneHeight,
          },
        ]}
      >
        {/* Dynamic Island / Camera Notch */}
        <View pointerEvents="none" style={styles.dynamicIsland}>
          <View style={styles.cameraLens} />
          <View style={styles.sensorDot} />
        </View>

        {/* Real App Screen Content */}
        <View style={styles.screenInner}>{children}</View>

        {/* Bottom Home Indicator Bar */}
        <View pointerEvents="none" style={styles.homeIndicator} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nativeRoot: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  webBackdrop: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#090d16',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  webRoleToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  webHeaderBadge: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  webHeaderBadgeText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  roleTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 3,
    gap: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleTabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  roleTabBtnActive: {
    backgroundColor: '#0284c7',
  },
  roleTabBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  roleTabBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  phoneFrame: {
    position: 'relative',
    backgroundColor: '#ffffff',
    borderRadius: 48,
    borderWidth: 10,
    borderColor: '#1e293b',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.6,
    shadowRadius: 50,
    elevation: 24,
  },
  dynamicIsland: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    width: 110,
    height: 26,
    backgroundColor: '#000000',
    borderRadius: 16,
    zIndex: 99999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  cameraLens: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#1e293b',
  },
  sensorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#090d16',
  },
  screenInner: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    width: 130,
    height: 4.5,
    backgroundColor: '#94a3b8',
    borderRadius: 3,
    zIndex: 99999,
  },
});
