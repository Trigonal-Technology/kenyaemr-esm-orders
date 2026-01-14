import { useCallback, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { openmrsFetch, restBaseUrl, useConfig } from '@openmrs/esm-framework';
import { type Result } from '../imaging-tabs/work-list/work-list.resource';
import { type ImagingConfig } from '../config-schema';

export type OrderStatus = 'ACTIVE' | 'any';

/**
 * Hook to fetch all radiology orders for a specific patient
 * Similar to usePatientOrders but specifically for radiology orders
 */
export function usePatientRadiologyOrders(
    patientUuid: string,
    status: OrderStatus = 'ACTIVE',
    startDate?: string,
    endDate?: string,
) {
    const {
        orders: { radiologyOrderTypeUuid },
        radiologyConceptClassUuid,
    } = useConfig<ImagingConfig>();

    const { mutate: globalMutate } = useSWRConfig();

    const responseFormat =
        'custom:(uuid,orderNumber,patient:(uuid,display,identifiers,person:(uuid,display,age,gender)),concept:(uuid,display,conceptClass),action,careSetting,orderer:ref,urgency,instructions,modality,orderReasonNonCoded,orderReason,bodySite,laterality,commentToFulfiller,display,fulfillerStatus,dateStopped,scheduledDate,dateActivated,fulfillerComment)';

    // Build URL - use isStopped=false instead of status=ACTIVE when using orderTypes
    // because the API doesn't support both parameters together
    // Build URL - Get all orders regardless of status to support history
    // We will filter out superseded orders manually
    const baseUrl =
        startDate && endDate
            ? `${restBaseUrl}/order?patient=${patientUuid}&orderTypes=${radiologyOrderTypeUuid}&v=${responseFormat}&activatedOnOrAfterDate=${startDate}&activatedOnOrBeforeDate=${endDate}`
            : `${restBaseUrl}/order?patient=${patientUuid}&orderTypes=${radiologyOrderTypeUuid}&v=${responseFormat}`;

    const { data, error, isLoading, mutate } = useSWR<{ data: { results: Array<Result> } }>(
        patientUuid ? baseUrl : null,
        openmrsFetch,
    );

    const filteredOrders = useMemo(() => {
        if (!data?.data?.results) return [];

        // Filter to only radiology orders (by concept class)
        // AND exclude superseded orders: action=NEW, stopped, and not declined/completed
        return data.data.results
            .filter((order) => {
                const isRadiology = order.concept?.conceptClass?.uuid === radiologyConceptClassUuid;

                // User logic: exclude if action=NEW AND dateStopped!=null AND fulfillerStatus NOT IN (DECLINED, COMPLETED)
                const isSuperseded =
                    order.action === 'NEW' &&
                    order.dateStopped !== null &&
                    order.fulfillerStatus !== 'DECLINED' &&
                    order.fulfillerStatus !== 'COMPLETED';

                return isRadiology && !isSuperseded;
            })
            .sort((a, b) => new Date(b.dateActivated).getTime() - new Date(a.dateActivated).getTime());
    }, [data, radiologyConceptClassUuid]);

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
