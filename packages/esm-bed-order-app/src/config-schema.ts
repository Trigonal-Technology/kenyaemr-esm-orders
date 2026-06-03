import { careSettingUuid } from './form/add-bed-order/api';
import { Type } from '@openmrs/esm-framework';

export const configSchema = {
  bedOrderQuantityUnitsConceptSetUuid: {
    _type: Type.String,
    _description: 'Bed Order Quantity Units Concept SET UUID',
    _default: '162402AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  },
  bedOrderConceptSetUuid: {
    _type: Type.String,
    _description: 'Bed Order Concept SET UUID',
    _default: '',
  },
  bedOrderConceptClassUuid: {
    _type: Type.String,
    _description: 'Bed Order Concept Class UUID',
    _default: '',
  },
  orders: {
    bedOrderTypeUuid: {
      _type: Type.UUID,
      _description: "UUID for the 'Bed' order type",
      _default: 'f7f5be84-8c72-4a35-89eb-8163457e4a5d',
    },
    bedOrderableConcepts: {
      _type: Type.Array,
      _description:
        'UUIDs of concepts that represent orderable bed. If an empty array `[]` is provided, every concept with class `Bed` will be considered orderable.',
      _elements: {
        _type: Type.UUID,
      },
      _default: [],
    },
  },
  careSettingUuid: {
    _type: Type.String,
    _description: 'Care Setting UUID',
    _default: '6f0c9a92-6f24-11e3-af88-005056821db0',
  },
  admissionReasonConceptSetUuid: {
    _type: Type.String,
    _description: 'Admission Reason Concept SET UUID',
    _default: '160430AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  },
  wardConceptSetUuid: {
    _type: Type.String,
    _description: 'Ward Concept SET UUID',
    _default: '160430AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  },
};

interface OrderReason {
  bedOrderUuid: string;
  required: boolean;
  orderReasons: Array<string>;
}
export type BedOrderConfig = {
  bedOrderQuantityUnitsConceptSetUuid: string;
  bedOrderConceptClassUuid: string;
  bedOrderConceptSetUuid: string;
  orders: {
    bedOrderableConcepts: Array<string>;
    bedOrderTypeUuid: string;
  };
  careSettingUuid: string;
  bedOrderWithOrderReasons: Array<OrderReason>;
  admissionReasonConceptSetUuid: string;
  wardConceptSetUuid: string;
};
