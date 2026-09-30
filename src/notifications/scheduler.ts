import { addDays } from 'date-fns';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

import type { Db } from '@/db/types';
import { toDateKey } from '@/domain/dates';
import { listAppointments } from '@/repositories/appointments';
import { listDoseLogs } from '@/repositories/doses';
import { listMedications, listSchedules } from '@/repositories/medications';

import { HORIZON_DAYS, planNotifications } from './plan';

const CHANNEL_ID = 'reminders';
const supported = Platform.OS === 'ios' || Platform.OS === 'android';

/** Chamado uma vez ao carregar o app: como mostrar lembretes com o app aberto, e o canal do Android. */
export function configureNotifications(): void {
  if (!supported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Lembretes',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function getPermissionState(): Promise<PermissionState> {
  if (!supported) return 'denied';
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return 'granted';
  return settings.canAskAgain ? 'undetermined' : 'denied';
}

/**
 * O iOS mostra o pedido de permissão uma única vez. Antes dele, explicamos o motivo;
 * se a pessoa disser "Agora não", o pedido do sistema fica guardado para outra hora.
 */
export async function askForRemindersIfNeeded(): Promise<PermissionState> {
  const state = await getPermissionState();
  if (state !== 'undetermined') return state;

  const accepted = await new Promise<boolean>((resolve) =>
    Alert.alert(
      'Lembretes na hora certa',
      'O App RCU avisa na hora de cada dose e antes das consultas, mesmo com o app fechado e sem internet. Tudo fica no seu celular.',
      [
        { text: 'Agora não', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Ativar lembretes', onPress: () => resolve(true) },
      ],
    ),
  );
  if (!accepted) return 'undetermined';

  const result = await Notifications.requestPermissionsAsync();
  return result.granted ? 'granted' : result.canAskAgain ? 'undetermined' : 'denied';
}

let queue: Promise<void> = Promise.resolve();

/**
 * Cancela tudo e agenda de novo a partir do banco. Chame ao abrir o app e depois de
 * qualquer mudança em remédios, doses marcadas ou consultas. As chamadas entram numa
 * fila, então duas mudanças seguidas não se atropelam.
 */
export function rescheduleAll(db: Db): Promise<void> {
  queue = queue.then(() => reschedule(db)).catch((error: unknown) => {
    console.warn('Falha ao reagendar lembretes', error);
  });
  return queue;
}

async function reschedule(db: Db): Promise<void> {
  if (!supported || (await getPermissionState()) !== 'granted') return;

  const now = new Date();
  const [medications, schedules, logs, appointments] = await Promise.all([
    listMedications(db),
    listSchedules(db),
    listDoseLogs(db, toDateKey(now), toDateKey(addDays(now, HORIZON_DAYS))),
    listAppointments(db),
  ]);
  const plan = planNotifications({ medications, schedules, logs, appointments, now });

  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const n of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: n.identifier,
      content: { title: n.title, body: n.body, data: { url: n.url }, sound: 'default' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: n.date,
        channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
      },
    });
  }
}
