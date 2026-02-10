import React from 'react';
import {
  type OrderBasketWindowProps,
  type OrderBasketItem,
  type PatientWorkspace2DefinitionProps,
} from '@openmrs/esm-patient-common-lib';
import AddMedicalSupplyOrder from './add-medical-supply-order.component';

export interface AddTestOrderWorkspaceProps {
  order?: OrderBasketItem;
  orderTypeUuid: string;
  orderToEditOrdererUuid?: string;
}

export default function AddTestOrderWorkspace({
  groupProps: { patient, visitContext },
  workspaceProps: { order: initialOrder, orderTypeUuid, orderToEditOrdererUuid },
  closeWorkspace,
}: PatientWorkspace2DefinitionProps<AddTestOrderWorkspaceProps, OrderBasketWindowProps>) {
  return (
    <AddMedicalSupplyOrder
      patient={patient}
      orderToEditOrdererUuid={orderToEditOrdererUuid}
      visitContext={visitContext}
      initialOrder={initialOrder}
      orderTypeUuid={orderTypeUuid}
      closeWorkspace={closeWorkspace}
    />
  );
}
