import { openmrsFetch, useConfig, restBaseUrl } from '@openmrs/esm-framework';
import { useMemo } from 'react';
import fuzzy from 'fuzzy';

import { type MedicalSupplyConfig } from '../config-schema';
import { type Concept } from '../types';
import useSWR from 'swr';

export interface MedicalSupplyType {
  label: string;
  conceptUuid: string;
}

export interface UseMedicalSupplyType {
  medicalSupplyTypes: Array<MedicalSupplyType>;
  isLoading: boolean;
  error: Error;
}

export function useQuantityUnits() {
  const config = useConfig<MedicalSupplyConfig>();
  const apiUrl = `${restBaseUrl}/concept/${config.medicalSupplyQuantityUnitsConceptSetUuid}?v=custom:setMembers`;
  const { data, error, isLoading } = useSWR<{ data: Concept }, Error>(apiUrl, openmrsFetch);
  return {
    quantityUnits: data?.data?.setMembers ? data?.data?.setMembers : [],
    isLoading,
    isError: error,
  };
}

function openmrsFetchMultiple(urls: Array<string>) {
  return Promise.all(urls.map((url) => openmrsFetch<{ results: Array<Concept> }>(url)));
}

export function useMedicalSupplyTypes(searchTerm = ''): UseMedicalSupplyType {
  const config = useConfig<MedicalSupplyConfig>();
  const {
    orders: { medicalSupplyOrderableConcepts },
  } = config;

  const { data, isLoading, error } = useSWR(
    () =>
      medicalSupplyOrderableConcepts.length
        ? medicalSupplyOrderableConcepts.map((c) => `${restBaseUrl}/concept/${c}`)
        : `${restBaseUrl}/concept/${config.medicalSupplyConceptSetUuid}?v=custom:setMembers`,
    (medicalSupplyOrderableConcepts.length ? openmrsFetchMultiple : openmrsFetch) as any,
  );

  const medicalSupplyConcepts = useMemo(() => {
    if (isLoading || error) {
      return [] as Array<MedicalSupplyType>;
    }
    const concepts: Array<Concept> = medicalSupplyOrderableConcepts.length
      ? (data as any[])?.map((d) => d.data)
      : (data as any)?.data?.setMembers ?? [];

    return concepts.map((concept) => ({
      label: concept.display,
      conceptUuid: concept.uuid,
    })) as Array<MedicalSupplyType>;
  }, [data, isLoading, error, medicalSupplyOrderableConcepts.length]);

  const filteredMedicalSupplyTypes = useMemo(() => {
    return searchTerm && !isLoading && !error
      ? fuzzy.filter(searchTerm, medicalSupplyConcepts, { extract: (c) => c.label }).map((result) => result.original)
      : medicalSupplyConcepts;
  }, [medicalSupplyConcepts, searchTerm, isLoading, error]);

  return {
    medicalSupplyTypes: filteredMedicalSupplyTypes,
    isLoading,
    error,
  };
}
