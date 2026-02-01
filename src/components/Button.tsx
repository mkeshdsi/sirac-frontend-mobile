import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator, View, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline';
export type ButtonSize = 'small' | 'medium' | 'large';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  disabled?: boolean;
  iconName?: IoniconName;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  iconSize?: number;
  iconColor?: string;
}

export const Button: React.FC<Props> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  style,
  loading = false,
  disabled = false,
  iconName,
  icon,
  iconPosition = 'left',
  iconSize = 18,
  iconColor,
}) => {
  const containerStyles = [
    styles.base,
    styles[size],
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'outline' && styles.outline,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    variant === 'secondary' && styles.textSecondary,
    variant === 'outline' && styles.textOutline,
  ];

  const currentTextColor =
    (variant === 'secondary' || variant === 'outline') ? Theme.colors.textPrimary : '#FFFFFF';
  const effectiveIconColor = iconColor || currentTextColor;

  return (
    <TouchableOpacity style={containerStyles} onPress={onPress} activeOpacity={0.8} disabled={disabled || loading}>
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? Theme.colors.textPrimary : '#FFF'} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && icon}
          {iconName && iconPosition === 'left' && (
            <Ionicons name={iconName} size={iconSize} color={effectiveIconColor} style={styles.iconLeft} />
          )}
          <Text style={textStyles}>{title}</Text>
          {iconName && iconPosition === 'right' && (
            <Ionicons name={iconName} size={iconSize} color={effectiveIconColor} style={styles.iconRight} />
          )}
          {icon && iconPosition === 'right' && icon}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  small: {
    paddingVertical: Theme.spacing.sm,
  },
  medium: {
    paddingVertical: Theme.spacing.md,
  },
  large: {
    paddingVertical: Theme.spacing.xl,
  },
  primary: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  secondary: {
    backgroundColor: Theme.colors.secondary,
    borderColor: Theme.colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: Theme.colors.textPrimary,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    ...Theme.typography.h4,
    color: '#FFFFFF',
  },
  textSecondary: {
    color: Theme.colors.textPrimary,
  },
  textOutline: {
    color: Theme.colors.textPrimary,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconLeft: {
    marginRight: 6,
  },
  iconRight: {
    marginLeft: 6,
  },
});
