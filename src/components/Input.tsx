import React, { ReactNode } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { Theme } from '@/constants/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  required?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input: React.FC<Props> = ({ label, error, containerStyle, required, leftIcon, rightIcon, ...rest }) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {!!label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <View style={[styles.inputWrapper, !!error && styles.inputError]}
      >
        {!!leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={Theme.colors.gray400}
          style={styles.input}
          {...rest}
        />
        {!!rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
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
  inputWrapper: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    color: Theme.colors.textPrimary,
    ...Theme.typography.body1,
  },
  inputError: {
    borderColor: Theme.colors.error,
  },
  iconLeft: {
    paddingLeft: Theme.spacing.md,
  },
  iconRight: {
    paddingRight: Theme.spacing.md,
  },
  error: {
    marginTop: 4,
    color: Theme.colors.error,
    ...Theme.typography.caption,
  },
});
