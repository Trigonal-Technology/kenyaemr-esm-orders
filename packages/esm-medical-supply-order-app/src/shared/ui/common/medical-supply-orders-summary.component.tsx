import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig, useDefineAppContext } from '@openmrs/esm-framework';
import MedicalSupplyOrdersTable from './medical-supply-orders-table.component';
import dayjs from 'dayjs';
import { type MedicalSupplyConfig } from '../../../config-schema';

export interface MedicalSupplyOrdersSummaryProps {
    patientUuid: string;
}

const MedicalSupplyOrdersSummary: React.FC<MedicalSupplyOrdersSummaryProps> = ({ patientUuid }) => {
    const { t } = useTranslation();
    const medicalSupplyOrdersDisplayText = t('medicalSupplyOrders', 'Medical Supply Orders');
    const { careSettingUuid } = useConfig<MedicalSupplyConfig>();
    const [dateRange, setDateRange] = useState<Array<Date>>([dayjs().startOf('day').toDate(), new Date()]);

    useDefineAppContext('medical-supply-date-filter', { dateRange, setDateRange });

    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <MedicalSupplyOrdersTable
                patientUuid={patientUuid}
                showAddButton
                title={medicalSupplyOrdersDisplayText}
            />
        </div>
    );
};

export default MedicalSupplyOrdersSummary;
