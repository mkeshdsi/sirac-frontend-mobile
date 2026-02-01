import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';

export interface SelectOption {
  id: number | string;
  label: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  value?: string | number | null;
  onChange: (val: string) => void;
  options: SelectOption[];
  loading?: boolean;
  errorText?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  placeholder = 'Selecionar...',
  value,
  onChange,
  options,
  loading,
  errorText,
}) => {
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => String(o.id) === String(value));

  return (
    <View style={{ marginBottom: Theme.spacing.md }}>
      {!!label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}

      <TouchableOpacity style={styles.selector} onPress={() => !loading && setOpen(true)}>
        <Text style={selected ? styles.valueText : styles.placeholderText}>
          {loading ? 'A carregar...' : selected ? selected.label : placeholder}
        </Text>
      </TouchableOpacity>

      {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Selecionar'}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text style={styles.modalClose}>Fechar</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <Text style={styles.loadingText}>A carregar...</Text>
            ) : (
              <FlatList
                data={options}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.optionRow, String(item.id) === String(value) && styles.optionSelected]}
                    onPress={() => {
                      onChange(String(item.id));
                      setOpen(false);
                    }}
                  >
                    <Text style={styles.optionLabel}>{item.label}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>Sem opções</Text>}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  label: { ...Theme.typography.caption, color: Theme.colors.textSecondary, marginBottom: 6 },
  selector: {
    paddingVertical: 12,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border || '#ddd',
    backgroundColor: Theme.colors.surface,
  },
  placeholderText: { ...Theme.typography.body2, color: Theme.colors.textSecondary },
  valueText: { ...Theme.typography.body2, color: Theme.colors.textPrimary },
  errorText: { ...Theme.typography.caption, color: Theme.colors.error || '#d32f2f', marginTop: 6 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalCard: { maxHeight: '70%', backgroundColor: Theme.colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: Theme.spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Theme.spacing.md, borderBottomWidth: 1, borderBottomColor: Theme.colors.border || '#eee' },
  modalTitle: { ...Theme.typography.h4, color: Theme.colors.textPrimary },
  modalClose: { ...Theme.typography.body2, color: Theme.colors.primary, fontWeight: '700' },
  loadingText: { ...Theme.typography.body2, color: Theme.colors.textSecondary, padding: Theme.spacing.md },
  optionRow: { paddingVertical: 14, paddingHorizontal: Theme.spacing.md, borderBottomWidth: 1, borderBottomColor: Theme.colors.border || '#f0f0f0' },
  optionSelected: { backgroundColor: Theme.colors.primary + '11' },
  optionLabel: { ...Theme.typography.body2, color: Theme.colors.textPrimary },
  emptyText: { ...Theme.typography.body2, color: Theme.colors.textSecondary, padding: Theme.spacing.md, textAlign: 'center' },
});

export default Select;
