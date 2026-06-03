import { Type } from '@openmrs/esm-framework';

export const configSchema = {
  radiologyConceptSetUuid: {
    _type: Type.String,
    _description: 'Radiology Concept SET UUID',
    _default: 'cd9f116c-517d-439e-847d-d8d257434083',
  },
  radiologyConceptClassUuid: {
    _type: Type.String,
    _description: 'Radiology Concept Class UUID',
    _default: '8caa332c-efe4-4025-8b18-3398328e1323',
  },
  orders: {
    radiologyOrderTypeUuid: {
      _type: Type.UUID,
      _description: "UUID for the 'Radiology' order type",
      _default: 'c19c8e82-8b8d-4b4e-b1ff-3f09890b2db3',
    },
    labOrderTypeUuid: {
      _type: Type.UUID,
      _description: "UUID for the 'Lab' order type",
      _default: '52a447d3-a64a-11e3-9aeb-50e549534c5e',
    },
    labOrderableConcepts: {
      _type: Type.Array,
      _description:
        'UUIDs of concepts that represent orderable lab tests or lab sets. If an empty array `[]` is provided, every concept with class `Test` will be considered orderable.',
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
  radiologyReportFormUuid: {
    _type: Type.String,
    _description: 'Radiology Report Form UUID',
    _default: '052e2315-ffcc-36bd-a6ce-6851a9414361',
  },
  ohifViewerUrl: {
    _type: Type.String,
    _description: 'OHIF Viewer URL',
    _default: '/ohif/viewer',
  },
};

interface OrderReason {
  labTestUuid: string;
  required: boolean;
  orderReasons: Array<string>;
}

export type ImagingConfig = {
  radiologyConceptSetUuid: string;
  orders: {
    labOrderTypeUuid: string;
    labOrderableConcepts: Array<string>;
    radiologyOrderTypeUuid: string;
  };
  careSettingUuid: string;
  radiologyConceptClassUuid: string;
  radiologyReportFormUuid: string;
  ohifViewerUrl: string;
};
