import { careSettingUuid } from './form/add-medical-supply-order/api';
import { Type } from '@openmrs/esm-framework';

export const configSchema = {
  medicalSupplyQuantityUnitsConceptSetUuid: {
    _type: Type.String,
    _description: 'Medical Supply Quantity Units Concept SET UUID',
    _default: '162402AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  },
  medicalSupplyConceptSetUuid: {
    _type: Type.String,
    _description: 'Medical Supply Concept SET UUID',
    _default: '095befe9-ff7c-4eba-bbd8-37b055f52e7d',
  },
  medicalSupplyConceptClassUuid: {
    _type: Type.String,
    _description: 'Medical Supply Concept Class UUID',
    _default: '',
  },
  orders: {
    medicalSupplyOrderTypeUuid: {
      _type: Type.UUID,
      _description: "UUID for the 'Medical Supply' order type",
      _default: 'dab3ab30-2feb-48ec-b4af-8332a0831b49',
    },
    medicalSupplyOrderableConcepts: {
      _type: Type.Array,
      _description:
        'UUIDs of concepts that represent orderable medical supply. If an empty array `[]` is provided, every concept with class `Medical supply` will be considered orderable.',
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
};

interface OrderReason {
  medicalSupplyUuid: string;
  required: boolean;
  orderReasons: Array<string>;
}
export type MedicalSupplyConfig = {
  medicalSupplyQuantityUnitsConceptSetUuid: string;
  medicalSupplyConceptClassUuid: string;
  medicalSupplyConceptSetUuid: string;
  orders: {
    medicalSupplyOrderableConcepts: Array<string>;
    medicalSupplyOrderTypeUuid: string;
  };
  careSettingUuid: string;
  medicalSupplyWithOrderReasons: Array<OrderReason>;
};
