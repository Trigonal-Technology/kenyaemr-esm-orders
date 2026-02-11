import React from 'react';
import {
  type OrderBasketWindowProps,
  type OrderBasketItem,
  type PatientWorkspace2DefinitionProps,
} from '@openmrs/esm-patient-common-lib';
import AddImagingOrder from './add-imaging-order.component';

export interface AddTestOrderWorkspaceProps {
  order?: OrderBasketItem;
  orderTypeUuid: string;

  /**
   * This field should only be supplied for an existing order saved to the backend
   */
  orderToEditOrdererUuid?: string;
}

export default function AddTestOrderWorkspace({
  groupProps: { patient, visitContext },
  workspaceProps: { order: initialOrder, orderTypeUuid, orderToEditOrdererUuid },
  closeWorkspace,
}: PatientWorkspace2DefinitionProps<AddTestOrderWorkspaceProps, OrderBasketWindowProps>) {
  return (
    <AddImagingOrder
      patient={patient}
      orderToEditOrdererUuid={orderToEditOrdererUuid}
      visitContext={visitContext}
      initialOrder={initialOrder}
      orderTypeUuid={orderTypeUuid}
      closeWorkspace={closeWorkspace}
    />
  );
}
