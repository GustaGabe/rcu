import { useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme';

type TextFieldProps = Pick<
  TextInputProps,
  'value' | 'onChangeText' | 'onBlur' | 'placeholder' | 'autoCapitalize' | 'returnKeyType' | 'onSubmitEditing' | 'maxLength'
> & {
  multiline?: boolean;
  invalid?: boolean;
  accessibilityLabel?: string;
};

export function TextField({ multiline = false, invalid = false, onBlur, ...props }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      {...props}
      multiline={multiline}
      placeholderTextColor={colors.inkSoft}
      selectionColor={colors.violet}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[
        styles.input,
        multiline && styles.multiline,
        focused && styles.focused,
        invalid && styles.invalid,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  multiline: { minHeight: 96, paddingTop: 14, textAlignVertical: 'top' },
  focused: { borderColor: colors.violet },
  invalid: { borderColor: colors.rose },
});
