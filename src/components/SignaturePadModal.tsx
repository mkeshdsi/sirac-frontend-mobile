import React, { useRef } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import Signature from 'react-native-signature-canvas';

interface Props {
  visible: boolean;
  onOK: (signatureBase64: string) => void;
  onClose: () => void;
}

export const SignaturePadModal: React.FC<Props> = ({ visible, onOK, onClose }) => {
  const ref = useRef<any>(null);

  const handleOK = (sig: string) => {
    // sig vem como dataURL base64 (ex.: 'data:image/png;base64,....')
    onOK(sig);
    onClose();
  };

  const handleClear = () => {
    ref.current?.clearSignature();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Assinatura</Text>
          <View style={styles.canvasContainer}>
            <Signature
              ref={ref}
              onOK={handleOK}
              onEmpty={() => {}}
              autoClear={false}
              webStyle={webStyle}
              descriptionText="Assine no espaço abaixo"
              clearText="Limpar"
              confirmText="Guardar"
            />
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={onClose}>
              <Text style={styles.btnOutlineText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={handleClear}>
              <Text style={styles.btnText}>Limpar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => ref.current?.readSignature()}>
              <Text style={styles.btnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 640,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  canvasContainer: {
    height: Platform.OS === 'web' ? 280 : 220,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  btnPrimary: { backgroundColor: '#01836b' },
  btnDanger: { backgroundColor: '#d32f2f' },
  btnOutline: { borderWidth: 2, borderColor: '#01836b', backgroundColor: '#fff' },
  btnText: { color: '#fff', fontWeight: '700' },
  btnOutlineText: { color: '#01836b', fontWeight: '700' },
});

// Estilos injetados no canvas (WebView)
const webStyle = `
  .m-signature-pad--footer { display: none; }
  .m-signature-pad { box-shadow: none; border: 0; }
  body,html { width: 100%; height: 100%; margin:0; }
`;

export default SignaturePadModal;
