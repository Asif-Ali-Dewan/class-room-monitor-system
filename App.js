import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

// ─── Simulated sensor update logic ───────────────────────────────────────────
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
function randomDelta(range) {
  return (Math.random() - 0.5) * 2 * range;
}

const MODES = ['Quiet Mode', 'Lecture Mode', 'Exam Mode'];

export default function App() {
  // Sensor state
  const [studentCount, setStudentCount] = useState(20);
  const [temperature, setTemperature] = useState(28.5);
  const [lightLevel, setLightLevel] = useState(593);
  const [gasPpm, setGasPpm] = useState(54);
  const [motion, setMotion] = useState('DETECTED');
  const [noiseLevel, setNoiseLevel] = useState('HIGH!');
  const [classroomMode, setClassroomMode] = useState(2); // 0=Quiet, 1=Lecture, 2=Exam
  const [activeAlert, setActiveAlert] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [studentTrend, setStudentTrend] = useState(3);

  // Animations
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.85)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for alert dots
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Simulate live sensor updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTemperature(prev => parseFloat(clamp(prev + randomDelta(0.3), 18, 40).toFixed(1)));
      setLightLevel(prev => Math.round(clamp(prev + randomDelta(30), 0, 1200)));
      setGasPpm(prev => Math.round(clamp(prev + randomDelta(5), 0, 200)));
      setStudentCount(prev => {
        const next = clamp(prev + Math.round(randomDelta(1)), 0, 45);
        setStudentTrend(next - prev);
        return next;
      });
      // Randomly change motion/noise based on mode
      if (classroomMode === 0) {
        setMotion(Math.random() > 0.7 ? 'DETECTED' : 'NONE');
        setNoiseLevel(Math.random() > 0.8 ? 'HIGH!' : 'LOW');
      } else if (classroomMode === 1) {
        setMotion('MUTED');
        setNoiseLevel('MUTED');
      } else {
        setMotion(Math.random() > 0.4 ? 'DETECTED' : 'NONE');
        setNoiseLevel(Math.random() > 0.3 ? 'HIGH!' : 'LOW');
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [classroomMode]);

  // Banner slide-in on alert
  useEffect(() => {
    Animated.timing(bannerAnim, {
      toValue: activeAlert ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [activeAlert]);

  const openAlertModal = () => {
    setShowAlertModal(true);
    Animated.parallel([
      Animated.spring(modalScaleAnim, { toValue: 1, friction: 7, useNativeDriver: true }),
      Animated.timing(modalOpacityAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const closeAlertModal = () => {
    Animated.parallel([
      Animated.timing(modalScaleAnim, { toValue: 0.85, duration: 180, useNativeDriver: true }),
      Animated.timing(modalOpacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => setShowAlertModal(false));
  };

  const selectAlert = (alert) => {
    setActiveAlert(alert);
    closeAlertModal();
  };

  const clearAlert = () => setActiveAlert(null);

  // ─── Derived display values ─────────────────────────────────────────────────
  const tempLabel = temperature >= 30 ? 'Hot' : temperature >= 26 ? 'Warm' : temperature >= 22 ? 'Comfortable' : 'Cool';
  const tempColor = temperature >= 30 ? '#FF6B6B' : temperature >= 26 ? '#FFC107' : '#4CAF50';

  const lightLabel =
    lightLevel > 700 ? 'Optimal' :
    lightLevel > 400 ? 'Bright (Day)' :
    lightLevel > 150 ? 'Normal' : 'Low (Night)';
  const lightColor = lightLevel > 400 ? '#4FC3F7' : '#9C27B0';

  const gasLabel = gasPpm > 100 ? 'Danger' : gasPpm > 60 ? 'Moderate' : 'Safe';
  const gasColor = gasPpm > 100 ? '#FF4444' : gasPpm > 60 ? '#FFC107' : '#4CAF50';

  const studentSubtitle =
    studentCount === 0 ? 'classroom empty' :
    classroomMode === 1 ? 'lecture in progress' :
    classroomMode === 2 ? 'exam in progress' : 'students detected';

  const alertBannerText =
    activeAlert === 'fire' ? '🚨  EMERGENCY: FIRE DETECTED — EVACUATE ROOM' :
    activeAlert === 'earthquake' ? '⚠  EARTHQUAKE ALERT — TAKE COVER IMMEDIATELY' :
    activeAlert === 'gas' ? '🔴  EMERGENCY: DANGEROUS GAS LEVELS — VENTILATE ROOM' :
    classroomMode === 2 ? '⚠  EXAM ALERT: High Motion & Noise Detected' :
    classroomMode === 0 ? '🟢  Security Active: Sensing Noise' : null;

  const alertBannerColor =
    activeAlert ? '#C62828' :
    classroomMode === 2 ? '#C62828' :
    '#1B5E20';

  // ─── Bar chart bars (student trend) ────────────────────────────────────────
  const bars = [0.4, 0.6, 0.5, 0.8, 0.7, 0.9, 1.0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* ── Top alert banner ─────────────────────────────────────────────── */}
      {alertBannerText && (
        <Animated.View
          style={[
            styles.topBanner,
            { backgroundColor: alertBannerColor },
            { opacity: bannerAnim, transform: [{ translateY: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }] },
          ]}
        >
          <Text style={styles.topBannerText}>{alertBannerText}</Text>
        </Animated.View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Smart Classroom</Text>
            <Text style={styles.headerTitleAccent}>Control</Text>
            <Text style={styles.headerSub}>Room 204 • AI Monitoring Active</Text>
          </View>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>

        {/* ── Alert Buttons ─────────────────────────────────────────────── */}
        <View style={styles.alertButtonRow}>
          <TouchableOpacity style={styles.sendAlertBtn} onPress={openAlertModal} activeOpacity={0.8}>
            <Text style={styles.sendAlertBtnText}>🔔  Send Alert</Text>
          </TouchableOpacity>
          {activeAlert && (
            <TouchableOpacity style={styles.clearAlertBtn} onPress={clearAlert} activeOpacity={0.8}>
              <Text style={styles.clearAlertBtnText}>✓  Clear Alert</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Student Count Card ───────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.studentRow}>
            <View>
              <Text style={styles.cardLabel}>Current Student Count</Text>
              <Text style={styles.studentCount}>{studentCount}</Text>
              <Text style={styles.studentSub}>{studentSubtitle}</Text>
            </View>
            <View style={styles.studentRight}>
              {studentCount > 0 && (
                <View style={styles.trendBadge}>
                  <Text style={styles.trendText}>▲ +{Math.abs(studentTrend || 3)} today</Text>
                </View>
              )}
              <View style={styles.miniBarChart}>
                {bars.map((h, i) => (
                  <View
                    key={i}
                    style={[styles.miniBar, { height: h * 28, backgroundColor: i === 6 ? '#4FC3F7' : '#1E4D7B' }]}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ── Environment Section ──────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Environment</Text>

        <View style={styles.twoColRow}>
          {/* Temperature */}
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.sensorIcon}>🌡</Text>
            <Text style={styles.cardLabel}>Temperature</Text>
            <Text style={[styles.sensorValue, { color: tempColor }]}>{temperature.toFixed(1)}°C</Text>
            <View style={[styles.badge, { backgroundColor: '#1A1000' }]}>
              <View style={[styles.badgeDot, { backgroundColor: tempColor }]} />
              <Text style={[styles.badgeText, { color: tempColor }]}>{tempLabel}</Text>
            </View>
          </View>

          {/* Light Level */}
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.sensorIcon}>✳️</Text>
            <Text style={styles.cardLabel}>Light Level</Text>
            <Text style={[styles.sensorValue, { color: '#4FC3F7' }]}>{lightLevel} lx</Text>
            <View style={[styles.badge, { backgroundColor: '#001525' }]}>
              <View style={[styles.badgeDot, { backgroundColor: lightColor }]} />
              <Text style={[styles.badgeText, { color: lightColor }]}>{lightLabel}</Text>
            </View>
          </View>
        </View>

        {/* Gas Sensor */}
        <View style={styles.card}>
          <View style={styles.gasRow}>
            <View style={styles.gasLeft}>
              <Text style={styles.sensorIcon}>💨</Text>
              <Text style={styles.cardLabel}>Gas Sensor (MQ-135)</Text>
              <Text style={[styles.sensorValue, { color: gasColor }]}>{gasPpm} PPM</Text>
            </View>
            <View style={styles.gasRight}>
              <Text style={styles.cardLabel}>Air Quality</Text>
              <View style={[styles.badge, styles.gasBadge, { backgroundColor: gasPpm > 100 ? '#3B0000' : '#003300' }]}>
                <View style={[styles.badgeDot, { backgroundColor: gasColor }]} />
                <Text style={[styles.badgeText, { color: gasColor }]}>{gasLabel}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Motion + Noise */}
        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.halfCard]}>
            <View style={styles.sensorHeaderRow}>
              <Text style={styles.cardLabel}>👤  Motion</Text>
              {motion === 'DETECTED' && (
                <Animated.View style={[styles.redDot, { transform: [{ scale: pulseAnim }] }]} />
              )}
            </View>
            <Text style={[
              styles.sensorStatusText,
              { color: motion === 'DETECTED' ? '#FF4444' : motion === 'MUTED' ? '#607D8B' : '#4CAF50' }
            ]}>
              {motion}
            </Text>
          </View>

          <View style={[styles.card, styles.halfCard]}>
            <View style={styles.sensorHeaderRow}>
              <Text style={styles.cardLabel}>🔊  Noise</Text>
              {noiseLevel === 'HIGH!' && (
                <Animated.View style={[styles.redDot, { transform: [{ scale: pulseAnim }] }]} />
              )}
            </View>
            <Text style={[
              styles.sensorStatusText,
              { color: noiseLevel === 'HIGH!' ? '#FF4444' : noiseLevel === 'MUTED' ? '#607D8B' : '#4CAF50' }
            ]}>
              {noiseLevel}
            </Text>
          </View>
        </View>

        {/* ── Classroom Mode ──────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Classroom Mode</Text>
        <View style={styles.modeContainer}>
          {MODES.map((mode, idx) => {
            const icons = ['🔇', '📋', '📄'];
            const isSelected = classroomMode === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={styles.modeRow}
                onPress={() => setClassroomMode(idx)}
                activeOpacity={0.7}
              >
                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.modeText, isSelected && styles.modeTextSelected]}>
                  {icons[idx]}  {mode}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Spacer */}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── Alert Modal ────────────────────────────────────────────────── */}
      <Modal transparent visible={showAlertModal} onRequestClose={closeAlertModal} animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalCard,
              { opacity: modalOpacityAnim, transform: [{ scale: modalScaleAnim }] },
            ]}
          >
            <Text style={styles.modalTitle}>Select Alert Type</Text>
            <Text style={styles.modalSub}>Choose which alert to broadcast to students</Text>

            <TouchableOpacity
              style={[styles.alertOption, styles.alertFire]}
              onPress={() => selectAlert('fire')}
              activeOpacity={0.8}
            >
              <Text style={styles.alertOptionTitle}>🔥  Fire Emergency</Text>
              <Text style={styles.alertOptionSub}>Evacuate immediately</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.alertOption, styles.alertEarthquake]}
              onPress={() => selectAlert('earthquake')}
              activeOpacity={0.8}
            >
              <Text style={styles.alertOptionTitle}>🌍  Earthquake Alert</Text>
              <Text style={styles.alertOptionSub}>Take cover immediately</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.alertOption, styles.alertGas]}
              onPress={() => selectAlert('gas')}
              activeOpacity={0.8}
            >
              <Text style={styles.alertOptionTitle}>💫  Gas Detected</Text>
              <Text style={styles.alertOptionSub}>Ventilate room immediately</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={closeAlertModal} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const BG = '#070F1F';
const CARD_BG = '#0C1E35';
const CARD_BORDER = '#152D4A';
const TEXT_WHITE = '#FFFFFF';
const TEXT_GRAY = '#7A8FA6';
const ACCENT_CYAN = '#00C4FF';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  scroll: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },

  // Banner
  topBanner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    zIndex: 100,
  },
  topBannerText: {
    color: TEXT_WHITE,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    marginTop: 4,
  },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: TEXT_WHITE },
  headerTitleAccent: { fontSize: 22, fontWeight: '700', color: ACCENT_CYAN, marginTop: -4 },
  headerSub: { fontSize: 13, color: TEXT_GRAY, marginTop: 4 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 5 },
  onlineText: { fontSize: 13, color: '#4CAF50', fontWeight: '600' },

  // Buttons
  alertButtonRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  sendAlertBtn: {
    backgroundColor: '#C62828',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  sendAlertBtnText: { color: TEXT_WHITE, fontWeight: '700', fontSize: 15 },
  clearAlertBtn: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  clearAlertBtnText: { color: '#4CAF50', fontWeight: '700', fontSize: 15 },

  // Cards
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 16,
    marginBottom: 12,
  },
  twoColRow: { flexDirection: 'row', gap: 10, marginBottom: 0 },
  halfCard: { flex: 1, marginBottom: 12 },

  // Student count
  studentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardLabel: { fontSize: 12, color: TEXT_GRAY, marginBottom: 4 },
  studentCount: { fontSize: 52, fontWeight: '800', color: TEXT_WHITE, lineHeight: 58 },
  studentSub: { fontSize: 12, color: TEXT_GRAY, marginTop: 2 },
  studentRight: { alignItems: 'flex-end', gap: 8 },
  trendBadge: {
    backgroundColor: '#0A2A0A',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  trendText: { color: '#4CAF50', fontSize: 12, fontWeight: '700' },
  miniBarChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 32 },
  miniBar: { width: 6, borderRadius: 3 },

  // Section title
  sectionTitle: { fontSize: 16, fontWeight: '700', color: TEXT_WHITE, marginBottom: 12, marginTop: 4 },

  // Sensor cards
  sensorIcon: { fontSize: 20, marginBottom: 6 },
  sensorValue: { fontSize: 26, fontWeight: '800', marginVertical: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  // Gas row
  gasRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  gasLeft: { flex: 1 },
  gasRight: { alignItems: 'flex-end' },
  gasBadge: { marginTop: 6 },

  // Motion / Noise
  sensorHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  redDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF4444' },
  sensorStatusText: { fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },

  // Classroom Mode
  modeContainer: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 16,
    gap: 14,
  },
  modeRow: { flexDirection: 'row', alignItems: 'center' },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: TEXT_GRAY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioOuterSelected: { borderColor: ACCENT_CYAN },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: ACCENT_CYAN },
  modeText: { fontSize: 15, color: TEXT_GRAY, fontWeight: '500' },
  modeTextSelected: { color: ACCENT_CYAN, fontWeight: '700' },

  // Alert Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#0F1E35',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E3A5F',
    padding: 24,
    width: '100%',
    maxWidth: 380,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: TEXT_WHITE, marginBottom: 6 },
  modalSub: { fontSize: 13, color: TEXT_GRAY, marginBottom: 20 },

  alertOption: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
  },
  alertFire: { borderColor: '#C62828', backgroundColor: '#1A0000' },
  alertEarthquake: { borderColor: '#B8860B', backgroundColor: '#1A1000' },
  alertGas: { borderColor: '#7B1FA2', backgroundColor: '#0F0018' },
  alertOptionTitle: { fontSize: 16, fontWeight: '700', color: TEXT_WHITE, marginBottom: 3 },
  alertOptionSub: { fontSize: 12, color: TEXT_GRAY },

  cancelBtn: {
    backgroundColor: '#152030',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelBtnText: { fontSize: 15, color: TEXT_WHITE, fontWeight: '600' },
});
