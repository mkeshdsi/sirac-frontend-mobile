declare module 'react-native-bootstrap-icons' {
  import * as React from 'react';
  import { ViewProps } from 'react-native';

  export interface IconProps extends ViewProps {
    width?: number;
    height?: number;
    color?: string;
  }

  // Export commonly used icon(s) explicitly
  export const BoxArrowRight: React.FC<IconProps>;

  // Fallback index signature (for other icons, if imported later)
  export const icons: Record<string, React.FC<IconProps>>;

  // Default export is not typically used, but keep it permissive
  const _default: any;
  export default _default;
}
