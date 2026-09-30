import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useDb } from '@/db/client';
import type { Db } from '@/db/types';

interface FocusQuery<T> {
  data: T | undefined;
  error: Error | undefined;
  /** Carrega de novo, por exemplo depois de gravar algo. */
  reload: () => void;
}

/**
 * Roda `load` sempre que a tela ganha foco, para refletir o que mudou em outras telas.
 * `load` deve ser estável: uma função de módulo ou envolvida em `useCallback`.
 */
export function useFocusQuery<T>(load: (db: Db) => Promise<T>): FocusQuery<T> {
  const db = useDb();
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error>();
  const [version, setVersion] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      load(db)
        .then((result) => {
          if (!active) return;
          setData(result);
          setError(undefined);
        })
        .catch((e: unknown) => {
          if (active) setError(e instanceof Error ? e : new Error(String(e)));
        });
      return () => {
        active = false;
      };
      // `version` força uma nova carga quando `reload` é chamado.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [db, load, version]),
  );

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, error, reload };
}
