import { supabase } from './supabase';

interface IdConfig {
  table: string;
  idColumn: string;
  prefix: string;
  digits: number;
}

const ID_CONFIGS: Record<string, IdConfig> = {
  member: { table: 'member', idColumn: 'member_id', prefix: 'M', digits: 3 },
  trainer: { table: 'trainer', idColumn: 'trainer_id', prefix: 'T', digits: 2 },
  batch: { table: 'batch', idColumn: 'batch_id', prefix: 'B', digits: 2 },
  membership_plan: { table: 'membership_plan', idColumn: 'plan_id', prefix: 'PL', digits: 2 },
  membership: { table: 'membership', idColumn: 'membership_id', prefix: 'MS', digits: 3 },
  payment: { table: 'payment', idColumn: 'payment_id', prefix: 'PM', digits: 3 },
  equipment: { table: 'equipment', idColumn: 'equipment_id', prefix: 'EQ', digits: 2 },
  fitness_program: { table: 'fitness_program', idColumn: 'program_id', prefix: 'FP', digits: 2 },
  feedback: { table: 'feedback', idColumn: 'feedback_id', prefix: 'FB', digits: 3 },
};

/**
 * Generates the next sequential ID for a given entity table.
 * e.g., for payment: finds max like PM012 -> returns PM013
 */
export async function getNextId(entity: keyof typeof ID_CONFIGS): Promise<string> {
  const config = ID_CONFIGS[entity];
  if (!config) {
    throw new Error(`Unknown entity for ID generation: ${String(entity)}`);
  }

  const { data, error } = await supabase
    .from(config.table)
    .select(config.idColumn);

  if (error) {
    console.error(`Error querying max id for ${config.table}:`, error);
    throw error;
  }

  let maxNum = 0;
  const prefixRegex = new RegExp(`^${config.prefix}(\\d+)$`, 'i');

  if (data && data.length > 0) {
    for (const row of data as any[]) {
      const val = row[config.idColumn];
      if (typeof val === 'string') {
        const match = val.match(prefixRegex);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    }
  }

  const nextNum = maxNum + 1;
  return `${config.prefix}${String(nextNum).padStart(config.digits, '0')}`;
}
