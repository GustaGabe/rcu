import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState, type ComponentProps } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';

import { AppMark } from '@/components/AppMark';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Surface } from '@/components/Surface';
import { Text } from '@/components/Text';
import { useDb } from '@/db/client';
import { clearAllData, loadExampleData } from '@/db/devData';
import { useOnboarding } from '@/hooks/useOnboarding';
import { askForRemindersIfNeeded, getPermissionState, rescheduleAll, type PermissionState } from '@/notifications/scheduler';
import { colors, radius, spacing } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export default function AboutScreen() {
  const db = useDb();
  const { restart } = useOnboarding();
  const [permission, setPermission] = useState<PermissionState>();
  const version = Constants.expoConfig?.version ?? '—';

  useFocusEffect(
    useCallback(() => {
      getPermissionState().then(setPermission);
    }, []),
  );

  async function enableReminders() {
    const state = await askForRemindersIfNeeded();
    setPermission(state);
    if (state === 'granted') await rescheduleAll(db);
  }

  function devMenu(action: 'load' | 'clear') {
    const load = action === 'load';
    Alert.alert(
      load ? 'Carregar dados de exemplo?' : 'Apagar todos os dados?',
      load
        ? 'Tudo o que estiver no aparelho será trocado por um mês de dados fictícios.'
        : 'Remédios, doses, diário e consultas serão apagados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: load ? 'Carregar' : 'Apagar',
          style: 'destructive',
          onPress: async () => {
            if (load) await loadExampleData(db);
            else await clearAllData(db);
            await rescheduleAll(db);
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <View style={styles.identity}>
        <AppMark size={72} />
        <View style={styles.flex}>
          <Text variant="title">App RCU</Text>
          <Text variant="caption">Versão {version}</Text>
        </View>
      </View>

      <View style={styles.notice}>
        <Ionicons name="medkit" size={20} color={colors.violet} />
        <View style={styles.flex}>
          <Text variant="bodyStrong">O app não dá orientação médica</Text>
          <Text variant="caption">
            Ele registra e organiza informações: não recomenda doses nem faz diagnósticos. Qualquer mudança no
            tratamento deve ser combinada com o seu médico. Em caso de piora forte, procure atendimento.
          </Text>
        </View>
      </View>

      <SectionHeader title="Privacidade" />
      <Surface style={styles.list}>
        <Item icon="phone-portrait-outline" title="Tudo fica no seu celular">
          Os dados são guardados neste aparelho e o app não os envia para lugar nenhum. Não há conta, servidor,
          nuvem, anúncios nem rastreamento.
        </Item>
        <Item icon="shield-checkmark-outline" title="Dados de saúde são sensíveis" divider>
          Pela LGPD, informações de saúde são dados pessoais sensíveis. Por isso o app foi feito para funcionar sem
          internet e sem enviar nada.
        </Item>
        <Item icon="cloud-outline" title="Backups do iPhone" divider>
          Como qualquer app, os dados podem entrar no backup do iPhone (iCloud ou computador), que é controlado por
          você nos Ajustes. Desinstalar o app apaga os dados do aparelho.
        </Item>
      </Surface>

      <SectionHeader title="Lembretes" />
      <Surface style={styles.list}>
        <Item
          icon={permission === 'granted' ? 'notifications' : 'notifications-off-outline'}
          title={permission === 'granted' ? 'Ativados' : 'Desligados'}
        >
          {permission === 'granted'
            ? 'Você recebe um aviso na hora de cada dose e antes das consultas.'
            : 'Sem permissão, o app não consegue avisar na hora das doses.'}
        </Item>
        <Item icon="moon-outline" title="Modos de Foco" divider>
          O Foco e o Não Perturbe podem silenciar os lembretes. Em Ajustes, Foco, adicione o App RCU aos apps
          permitidos.
        </Item>
      </Surface>
      {permission === 'undetermined' && <Button title="Ativar lembretes" variant="soft" onPress={enableReminders} />}
      {permission === 'denied' && (
        <Button title="Abrir Ajustes" variant="soft" icon="settings-outline" onPress={() => Linking.openSettings()} />
      )}

      <SectionHeader title="Introdução" />
      <Button title="Ver a introdução de novo" variant="soft" icon="play-circle-outline" onPress={restart} />

      {__DEV__ && (
        <>
          <SectionHeader title="Desenvolvimento" />
          <Text variant="caption">Só aparece no modo de desenvolvimento.</Text>
          <Button title="Carregar dados de exemplo" variant="soft" icon="flask-outline" onPress={() => devMenu('load')} />
          <Button title="Apagar todos os dados" variant="danger" icon="trash-outline" onPress={() => devMenu('clear')} />
        </>
      )}
    </Screen>
  );
}

function Item({ icon, title, children, divider = false }: { icon: IconName; title: string; children: string; divider?: boolean }) {
  return (
    <View style={[styles.item, divider && styles.divider]}>
      <Ionicons name={icon} size={20} color={colors.violet} style={styles.itemIcon} />
      <View style={styles.flex}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption">{children}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  notice: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.violetSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  list: { paddingVertical: spacing.xs, gap: 0 },
  item: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md },
  itemIcon: { marginTop: 2 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
});
