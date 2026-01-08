import React from 'react';
import { TextInput, StyleProp, TextInputProps, ViewStyle, StyleSheet } from 'react-native';
import { colors } from '@/lib/colors';

interface InputProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
  multiline?: boolean;
}

export default function Input({
  containerStyle,
  multiline = false,
  style,
  placeholderTextColor = colors.textSecondary,
  ...props
}: InputProps) {
  return (
    <TextInput
      {...props}
      multiline={multiline}
      placeholderTextColor={placeholderTextColor}
      style={[
        styles.input,
        multiline && styles.multiline,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 16,
    minHeight: 52,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
});

