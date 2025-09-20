import React from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { Theme } from '@/constants/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  required?: boolean;
}

export const Input: React.FC<Props> = ({ label, error, containerStyle, required, ...rest }) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {!!label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TextInput
        placeholderTextColor={Theme.colors.gray400}
        style={[styles.input, !!error && styles.inputError]}
        {...rest}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    ...Theme.typography.body2,
    color: Theme.colors.textPrimary,
    marginBottom: 6,
  },
  required: {
    color: Theme.colors.error,
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
    color: Theme.colors.textPrimary,
  },
  inputError: {
    borderColor: Theme.colors.error,
  },
  error: {
    marginTop: 4,
    color: Theme.colors.error,
    ...Theme.typography.caption,
  },
});
