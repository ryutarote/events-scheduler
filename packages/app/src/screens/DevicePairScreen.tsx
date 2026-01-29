import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import type { DevicePairScreenProps } from '../types';
import { useDeviceStore } from '../stores';
import { useTheme } from '../theme';

export const DevicePairScreen: React.FC<DevicePairScreenProps> = ({ nav }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const startPairing = useDeviceStore((state) => state.startPairing);
  const cancelPairing = useDeviceStore((state) => state.cancelPairing);
  const isLoading = useDeviceStore((state) => state.isLoading);
  const { colors } = useTheme();

  const handleCodeChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 6);
    setCode(cleaned);
    if (error) {
      setError('');
    }
  };

  const handlePair = async () => {
    if (code.length !== 6) {
      setError('6桁のコードを入力してください');
      return;
    }

    const success = await startPairing(code);
    if (success) {
      nav.back();
    } else {
      setError('ペアリングに失敗しました');
    }
  };

  const handleCancel = () => {
    cancelPairing();
    nav.back();
  };

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    header: { backgroundColor: colors.background },
    headerTitle: { color: colors.text },
    iconCircle: { backgroundColor: colors.card },
    description: { color: colors.textSecondary },
    codeDigitEmpty: { backgroundColor: colors.card, borderColor: colors.separator },
    codeDigitFilled: { backgroundColor: colors.card },
    codeDigitTextEmpty: { color: colors.textTertiary },
    codeDigitTextFilled: { color: colors.text },
    loadingText: { color: colors.textSecondary },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <Pressable onPress={handleCancel} style={styles.headerButton}>
          <Text style={styles.cancelText}>キャンセル</Text>
        </Pressable>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>端末をペアリング</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconSection}>
          <View style={[styles.iconCircle, dynamicStyles.iconCircle]}>
            <Text style={styles.icon}>📱</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={[styles.description, dynamicStyles.description]}>
          他の端末に表示されている{'\n'}6桁のペアリングコードを入力
        </Text>

        {/* Code Input Display */}
        <View style={styles.codeDisplay}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <View
              key={index}
              style={[
                styles.codeDigit,
                code[index] ? [styles.codeDigitFilled, dynamicStyles.codeDigitFilled] : [styles.codeDigitEmpty, dynamicStyles.codeDigitEmpty],
              ]}
            >
              <Text style={[
                styles.codeDigitText,
                code[index] ? [styles.codeDigitTextFilled, dynamicStyles.codeDigitTextFilled] : [styles.codeDigitTextEmpty, dynamicStyles.codeDigitTextEmpty],
              ]}>
                {code[index] || ''}
              </Text>
            </View>
          ))}
        </View>

        {/* Hidden Text Input */}
        <TextInput
          style={styles.hiddenInput}
          value={code}
          onChangeText={handleCodeChange}
          keyboardType="numeric"
          maxLength={6}
          autoFocus
          editable={!isLoading}
        />

        {/* Error Message */}
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        {/* Loading */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF3B30" />
            <Text style={[styles.loadingText, dynamicStyles.loadingText]}>ペアリング中...</Text>
          </View>
        ) : null}

        {/* Connect Button */}
        <Pressable
          style={[
            styles.connectButton,
            (code.length !== 6 || isLoading) && styles.connectButtonDisabled,
          ]}
          onPress={handlePair}
          disabled={code.length !== 6 || isLoading}
        >
          <Text style={[
            styles.connectButtonText,
            (code.length !== 6 || isLoading) && styles.connectButtonTextDisabled,
          ]}>
            接続
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    minWidth: 80,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  cancelText: {
    fontSize: 17,
    color: '#FF3B30',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  iconSection: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    fontSize: 40,
  },
  description: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  codeDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  codeDigit: {
    width: 45,
    height: 56,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeDigitEmpty: {
    borderWidth: 1,
  },
  codeDigitFilled: {
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  codeDigitText: {
    fontSize: 28,
    fontWeight: '500',
  },
  codeDigitTextEmpty: {},
  codeDigitTextFilled: {},
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
  },
  errorText: {
    fontSize: 15,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  loadingText: {
    fontSize: 15,
    marginTop: 12,
  },
  connectButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 12,
    marginTop: 16,
  },
  connectButtonDisabled: {
    backgroundColor: '#FFB3B0',
  },
  connectButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  connectButtonTextDisabled: {
    color: '#FFFFFF',
  },
});
