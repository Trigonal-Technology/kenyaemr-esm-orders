import { useCallback, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { openmrsFetch, restBaseUrl, useConfig } from '@openmrs/esm-framework';
import { type MedicalSupplyConfig } from '../config-schema';

export type OrderStatus = 'ACTIVE' | 'any';

export function usePatientMedicalSupplyOrders(
    patientUuid: string,
    status: OrderStatus = 'ACTIVE',
    startDate?: string,
    endDate?: string,
) {
    const {
        orders: { medicalSupplyOrderTypeUuid },
        medicalSupplyConceptClassUuid,
    } = useConfig<MedicalSupplyConfig>();

    const { mutate: globalMutate } = useSWRConfig();

    const responseFormat = 'full';

    const baseUrl =
        startDate && endDate
            ? `${restBaseUrl}/order?patient=${patientUuid}&v=${responseFormat}&orderTypes=${medicalSupplyOrderTypeUuid}&activatedOnOrAfterDate=${startDate}&activatedOnOrBeforeDate=${endDate}`
            : `${restBaseUrl}/order?patient=${patientUuid}&v=${responseFormat}&orderTypes=${medicalSupplyOrderTypeUuid}`;

    const { data, error, isLoading, mutate } = useSWR<{ data: { results: Array<any> } }>(
        patientUuid ? baseUrl : null,
        openmrsFetch,
    );

    const filteredOrders = useMemo(() => {
        if (!data?.data?.results) return [];

        return data.data.results
            .filter((order) => {
                // Determine if it's a medical supply order
                // 1. Check order type first
                const isCorrectType =
                    order.orderType?.uuid === medicalSupplyOrderTypeUuid ||
                    order.orderType?.display?.toLowerCase().includes('medical supply');

                // 2. Check concept class
                const conceptClassUuid = order.concept?.conceptClass?.uuid || order.concept?.conceptClass;
                const isMedicalSupplyClass = conceptClassUuid === medicalSupplyConceptClassUuid || !medicalSupplyConceptClassUuid;

                // 3. Exclude superseded orders
                // An order is superseded if it's been replaced by a revision or discontinued
                // In OpenMRS, this usually means it has a dateStopped but isn't 'Completed' or 'Declined'
                const isSuperseded =
                    order.dateStopped !== null &&
                    order.fulfillerStatus !== 'DECLINED' &&
                    order.fulfillerStatus !== 'COMPLETED';

                return (isCorrectType || isMedicalSupplyClass) && !isSuperseded;
            })
            .sort((a, b) => new Date(b.dateActivated).getTime() - new Date(a.dateActivated).getTime());
    }, [data, medicalSupplyConceptClassUuid, medicalSupplyOrderTypeUuid]);

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
