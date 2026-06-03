import { openmrsFetch, useConfig, restBaseUrl } from '@openmrs/esm-framework';

import { type BedOrderConfig } from '../config-schema';
import { type Concept } from '../types';
import useSWR from 'swr';

export interface BedOrderType {
  label: string;
  conceptUuid: string;
}

export interface UseBedOrderType {
  bedOrderTypes: Array<BedOrderType>;
  isLoading: boolean;
  error: Error;
}

export function useQuantityUnits() {
  const config = useConfig<BedOrderConfig>();
  const apiUrl = `${restBaseUrl}/concept/${config.bedOrderQuantityUnitsConceptSetUuid}?v=custom:setMembers`;
  const { data, error, isLoading } = useSWR<{ data: Concept }, Error>(apiUrl, openmrsFetch);
  return {
    quantityUnits: data?.data?.setMembers ? data?.data?.setMembers : [],
    isLoading,
    isError: error,
  };
}
