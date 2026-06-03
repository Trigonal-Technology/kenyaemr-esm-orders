import React from 'react';
import {
  type OrderBasketWindowProps,
  type OrderBasketItem,
  type PatientWorkspace2DefinitionProps,
} from '@openmrs/esm-patient-common-lib';
import AddBedOrder from './add-bed-order.component';

export interface AddBedOrderWorkspaceProps {
  order?: OrderBasketItem;
  orderTypeUuid: string;
  orderToEditOrdererUuid?: string;
}

export default function AddBedOrderWorkspace({
  groupProps: { patient, visitContext },
  workspaceProps: { order: initialOrder, orderTypeUuid, orderToEditOrdererUuid },
  closeWorkspace,
}: PatientWorkspace2DefinitionProps<AddBedOrderWorkspaceProps, OrderBasketWindowProps>) {
  return (
    <AddBedOrder
      patient={patient}
      orderToEditOrdererUuid={orderToEditOrdererUuid}
      visitContext={visitContext}
      initialOrder={initialOrder}
      orderTypeUuid={orderTypeUuid}
      closeWorkspace={closeWorkspace}
    />
  );
}
