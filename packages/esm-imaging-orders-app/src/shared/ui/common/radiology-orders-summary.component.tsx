import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ConfigObject, useConfig, useDefineAppContext } from '@openmrs/esm-framework';
import RadiologyOrdersTable from './radiology-orders-table.component';
import dayjs from 'dayjs';
import { type DateFilterContext } from '../../../types';

export interface RadiologyOrdersSummaryProps {
    patientUuid: string;
}

const RadiologyOrdersSummary: React.FC<RadiologyOrdersSummaryProps> = ({ patientUuid }) => {
    const { t } = useTranslation();
    const radiologyOrdersDisplayText = t('radiologyOrders', 'Radiology Orders');
    const { showPrintButton } = useConfig<ConfigObject>();
    const [dateRange, setDateRange] = useState<Array<Date>>([dayjs().startOf('day').toDate(), new Date()]);

    // Provide the date filter context that useOrdersWorkList expects
    useDefineAppContext<DateFilterContext>('imaging-date-filter', { dateRange, setDateRange });

    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <RadiologyOrdersTable
                patientUuid={patientUuid}
                showAddButton
                showPrintButton={showPrintButton}
                title={radiologyOrdersDisplayText}
            />
        </div>
    );
};

export default RadiologyOrdersSummary;
