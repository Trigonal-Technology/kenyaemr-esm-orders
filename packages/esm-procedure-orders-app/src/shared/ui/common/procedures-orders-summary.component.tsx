import React from 'react';
import { useTranslation } from 'react-i18next';
import { type ConfigObject, useConfig } from '@openmrs/esm-framework';
import ProceduresOrdersTable from './procedures-orders-table.component';

export interface ProceduresOrdersSummaryProps {
    patientUuid: string;
}

const ProceduresOrdersSummary: React.FC<ProceduresOrdersSummaryProps> = ({ patientUuid }) => {
    const { t } = useTranslation();
    const procedureOrdersDisplayText = t('procedureOrders', 'Procedure Orders');
    const { showPrintButton } = useConfig<ConfigObject>();

    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <ProceduresOrdersTable
                patientUuid={patientUuid}
                showAddButton
                showPrintButton={showPrintButton}
                title={procedureOrdersDisplayText}
            />
        </div>
    );
};

export default ProceduresOrdersSummary;
