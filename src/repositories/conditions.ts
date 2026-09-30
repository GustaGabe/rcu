import { getCondition, type ConditionDefinition } from '@/conditions';
import type { Db } from '@/db/types';

/** Ids das doenças que o usuário acompanha, na ordem em que foram adicionadas. */
export async function listActiveConditionIds(db: Db): Promise<string[]> {
  const rows = await db.getAllAsync<{ condition_id: string }>(
    'SELECT condition_id FROM user_conditions WHERE active = 1 ORDER BY added_at, condition_id',
  );
  return rows.map((r) => r.condition_id);
}

/**
 * A doença mostrada no diário. No MVP há uma só (a RCU, inserida pela migração 1);
 * com várias, esta função dá lugar a uma escolha na interface.
 */
export async function getPrimaryCondition(db: Db): Promise<ConditionDefinition> {
  const [id] = await listActiveConditionIds(db);
  if (!id) throw new Error('Nenhuma doença ativa em user_conditions.');
  return getCondition(id);
}
