import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import type { DeviceListScreenProps } from '../types';
import { useDeviceStore } from '../stores';
import { useTheme } from '../theme';

export const DeviceListScreen: React.FC<DeviceListScreenProps> = ({ nav }) => {
  const devices = useDeviceStore((state) => state.devices);
  const removeDevice = useDeviceStore((state) => state.removeDevice);
  const syncWithDevice = useDeviceStore((state) => state.syncWithDevice);
  const isLoading = useDeviceStore((state) => state.isLoading);
  const { colors } = useTheme();

  const handlePairNew = () => {
    nav.push('/devices/pair');
  };

  const handleSync = async (deviceId: string) => {
    await syncWithDevice(deviceId);
  };

  const handleRemove = (deviceId: string) => {
    removeDevice(deviceId);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    header: { backgroundColor: colors.background },
    headerTitle: { color: colors.text },
    section: { backgroundColor: colors.card },
    sectionLabel: { color: colors.textSecondary },
    addButtonText: { color: colors.text },
    chevron: { color: colors.textTertiary },
    emptyText: { color: colors.text },
    emptySubtext: { color: colors.textSecondary },
    deviceIconContainer: { backgroundColor: colors.backgroundTertiary },
    deviceName: { color: colors.text },
    deviceMeta: { color: colors.textSecondary },
    actionButton: { backgroundColor: colors.backgroundTertiary },
    separator: { backgroundColor: colors.separator },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>端末</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Add Device Button */}
        <View style={[styles.section, dynamicStyles.section]}>
          <Pressable style={styles.addButton} onPress={handlePairNew}>
            <View style={styles.addIconContainer}>
              <Text style={styles.addIcon}>+</Text>
            </View>
            <Text style={[styles.addButtonText, dynamicStyles.addButtonText]}>新しい端末をペアリング</Text>
            <Text style={[styles.chevron, dynamicStyles.chevron]}>›</Text>
          </Pressable>
        </View>

        {devices.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📱</Text>
            <Text style={[styles.emptyText, dynamicStyles.emptyText]}>ペアリング済みの端末がありません</Text>
            <Text style={[styles.emptySubtext, dynamicStyles.emptySubtext]}>
              上のボタンをタップして{'\n'}端末をペアリングしましょう
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionLabel, dynamicStyles.sectionLabel]}>ペアリング済みの端末</Text>
            <View style={[styles.section, dynamicStyles.section]}>
              {devices.map((device, index) => (
                <View key={device.id}>
                  <View style={styles.deviceRow}>
                    <View style={[styles.deviceIconContainer, dynamicStyles.deviceIconContainer]}>
                      <Text style={styles.deviceIcon}>📱</Text>
                    </View>
                    <View style={styles.deviceInfo}>
                      <Text style={[styles.deviceName, dynamicStyles.deviceName]}>{device.name}</Text>
                      <Text style={[styles.deviceMeta, dynamicStyles.deviceMeta]}>
                        最終同期: {formatDate(device.lastSyncAt)}
                      </Text>
                    </View>
                    <View style={styles.deviceActions}>
                      <Pressable
                        style={[styles.actionButton, dynamicStyles.actionButton]}
                        onPress={() => handleSync(device.id)}
                        disabled={isLoading}
                      >
                        <Text style={styles.actionButtonText}>同期</Text>
                      </Pressable>
                    </View>
                  </View>
                  {index < devices.length - 1 ? <View style={[styles.separator, dynamicStyles.separator]} /> : null}
                </View>
              ))}
            </View>

            {/* Remove Section */}
            <View style={styles.dangerSection}>
              {devices.map((device) => (
                <Pressable
                  key={device.id}
                  style={[styles.removeButton, dynamicStyles.section]}
                  onPress={() => handleRemove(device.id)}
                >
                  <Text style={styles.removeButtonText}>
                    「{device.name}」を削除
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '400',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 32,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addIcon: {
    fontSize: 20,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  addButtonText: {
    flex: 1,
    fontSize: 17,
  },
  chevron: {
    fontSize: 22,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  deviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deviceIcon: {
    fontSize: 24,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 17,
    fontWeight: '400',
    marginBottom: 2,
  },
  deviceMeta: {
    fontSize: 13,
  },
  deviceActions: {
    marginLeft: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FF3B30',
  },
  separator: {
    height: 0.5,
    marginLeft: 68,
  },
  dangerSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  removeButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  removeButtonText: {
    fontSize: 17,
    color: '#FF3B30',
  },
  bottomPadding: {
    height: 40,
  },
});
