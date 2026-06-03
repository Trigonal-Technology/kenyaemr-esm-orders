import { useMemo } from 'react';
import fuzzy from 'fuzzy';
import useSWR from 'swr';
import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
import { type BedOrder } from '../../../types';

export function useBedSearch(searchTerm: string, bedOrderConceptClass: string) {
  // const bedOrderSearchUrl = `${restBaseUrl}/conceptsearch?conceptClasses=${bedOrderConceptClass}&q=${searchTerm}`;
  const bedOrderSearchUrl = `${restBaseUrl}/bedtype?q=${searchTerm}`;

  const { data, error, isLoading } = useSWR<{ data: { results: Array<any> } }, Error>(
    bedOrderSearchUrl,
    openmrsFetch,
  );
  const bedOrderConcepts = useMemo(() => {
    // return data?.data?.results?.map((concept) => ({
    //   label: concept.display,
    //   conceptUuid: concept.concept.uuid,
    // }));
    return data?.data?.results?.map((bedType) => ({
      label: bedType.name,
      conceptUuid: bedType.uuid,
    }));
  }, [data]);

  const filteredBedOrderTypes = useMemo(() => {
    return searchTerm && !isLoading && !error
      ? fuzzy.filter(searchTerm, bedOrderConcepts, { extract: (c) => c.label }).map((result) => result.original)
      : bedOrderConcepts;
  }, [bedOrderConcepts, searchTerm, error, isLoading]);

  return {
    bedTypes: filteredBedOrderTypes,
    isLoading: isLoading,
    error: error,
  };
}
