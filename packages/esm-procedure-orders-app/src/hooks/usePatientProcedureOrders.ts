import { useCallback, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { openmrsFetch, restBaseUrl, useConfig } from '@openmrs/esm-framework';
import { type Result } from '../types';
import { type ConfigObject } from '../config-schema';

export type OrderStatus = 'ACTIVE' | 'any';

/**
 * Hook to fetch all procedure orders for a specific patient
 */
export function usePatientProcedureOrders(
    patientUuid: string,
    status: OrderStatus = 'ACTIVE',
    startDate?: string,
    endDate?: string,
) {
    const {
        procedureOrderTypeUuid,
        procedureConceptClassUuid,
    } = useConfig<ConfigObject>();

    const { mutate: globalMutate } = useSWRConfig();

    const responseFormat =
        'custom:(uuid,orderNumber,orderType:(uuid),patient:(uuid,display,identifiers,person:(uuid,display,age,gender)),concept:(uuid,display,conceptClass:(uuid,display)),encounter:(uuid,display),action,careSetting,orderer:ref,urgency,instructions,orderReasonNonCoded,orderReason,bodySite,laterality,commentToFulfiller,display,fulfillerStatus,dateStopped,scheduledDate,dateActivated,fulfillerComment)';

    const baseUrl =
        startDate && endDate
            ? `${restBaseUrl}/order?patient=${patientUuid}&orderTypes=${procedureOrderTypeUuid}&v=${responseFormat}&activatedOnOrAfterDate=${startDate}&activatedOnOrBeforeDate=${endDate}`
            : `${restBaseUrl}/order?patient=${patientUuid}&orderTypes=${procedureOrderTypeUuid}&v=${responseFormat}`;

    const { data, error, isLoading, mutate } = useSWR<{ data: { results: Array<Result> } }>(
        patientUuid ? baseUrl : null,
        openmrsFetch,
    );

    const filteredOrders = useMemo(() => {
        if (!data?.data?.results) return [];

        return data.data.results
            .filter((order) => {
                // Determine if it's a procedure order
                const conceptClassUuid = order.concept?.conceptClass?.uuid || order.concept?.conceptClass;
                const isProcedure = conceptClassUuid === procedureConceptClassUuid || !procedureConceptClassUuid;

                // 3. Exclude superseded orders
                const isSuperseded =
                    order.dateStopped !== null &&
                    order.fulfillerStatus !== 'DECLINED' &&
                    order.fulfillerStatus !== 'COMPLETED';

                return isProcedure && !isSuperseded;
            })
            .sort((a, b) => new Date(b.dateActivated).getTime() - new Date(a.dateActivated).getTime());
    }, [data, procedureConceptClassUuid]);

    const mutateOrders = useCallback(
        () =>
            globalMutate((key) => typeof key === 'string' && key.startsWith(`${restBaseUrl}/order?patient=${patientUuid}`)),
        [globalMutate, patientUuid],
    );

    return {
        data: filteredOrders,
        error,
        isLoading,
        mutate: mutateOrders,
    };
}
