import { type ProcedureOrderBasketItem } from '../../../types';
import { type ProceduresType } from './useProceduresTypes';

export const priorityOptions = [
  { value: 'STAT', label: 'Emergency' },
  { value: 'ROUTINE', label: 'Elective' },
  // { value: 'ON_SCHEDULED_DATE', label: 'Scheduled' },
];

export function createEmptyLabOrder(testType: ProceduresType, orderer: string, visit): ProcedureOrderBasketItem {
  return {
    action: 'NEW',
    display: testType.label,
    testType,
    visit,
  };
}
