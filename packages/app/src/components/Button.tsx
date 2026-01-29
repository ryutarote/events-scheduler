import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'text';
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}) => {
  const buttonStyle = [
    styles.button,
    variant === 'primary' && styles.primaryButton,
    variant === 'secondary' && styles.secondaryButton,
    variant === 'danger' && styles.dangerButton,
    variant === 'text' && styles.textButton,
    disabled && styles.disabledButton,
    style,
  ];

  const textStyle = [
    styles.text,
    variant === 'primary' && styles.primaryText,
    variant === 'secondary' && styles.secondaryText,
    variant === 'danger' && styles.dangerText,
    variant === 'text' && styles.textButtonText,
    disabled && styles.disabledText,
  ];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        ...buttonStyle,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={textStyle}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#FF3B30',
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
  },
  dangerButton: {
    backgroundColor: 'transparent',
  },
  textButton: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  disabledButton: {
    backgroundColor: '#E5E5EA',
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    fontSize: 17,
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#000000',
  },
  dangerText: {
    color: '#FF3B30',
    fontSize: 17,
  },
  textButtonText: {
    color: '#FF3B30',
    fontWeight: '400',
  },
  disabledText: {
    color: '#8E8E93',
  },
});
