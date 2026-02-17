import { Type } from '@openmrs/esm-framework';

export const configSchema = {
  procedureOrderTypeUuid: {
    _type: Type.String,
    _description: 'Procedure Order type UUID',
    _default: '4237a01f-29c5-4167-9d8e-96d6e590aa33',
  },
  procedureConceptSetUuid: {
    _type: Type.String,
    _description: 'Procedure Concept SET UUID',
    _default: '	0c3019b0-9bd3-4bc7-8e2c-e6230c31ed18',
  },
  testOrderTypeUuid: {
    _type: Type.String,
    _description: 'Test Order type UUID',
    _default: '52a447d3-a64a-11e3-9aeb-50e549534c5e',
  },
  enableSpecimenIdAutoGeneration: {
    _type: Type.Boolean,
    _description: 'Enable specimen ID auto-generation',
    _default: false,
  },
  orders: {
    _type: Type.Object,
    _description: 'List of lab orderable concepts',
    _default: {
      labOrderableConcepts: [],
      labOrderTypeUuid: '',
    },
  },
  conditionConceptClassUuid: {
    _type: Type.ConceptUuid,
    _description: 'The concept class UUID for conditions',
    _default: '8d4918b0-c2cc-11de-8d13-0010c6dffd0f',
  },
  procedureComplicationGroupingConceptUuid: {
    _type: Type.ConceptUuid,
    _description: 'The concept UUID for grouping procedure complications obs',
    _default: '120202AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  },
  procedureComplicationConceptUuid: {
    _type: Type.ConceptUuid,
    _description: 'The concept UUID for capturing procedure complications',
    _default: '120198AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  },
  procedureResultEncounterType: {
    _type: Type.String,
    _description: 'The procedure results encounter type UUID',
    _default: '99a7a6ba-59f4-484e-880d-01cbeaead62f',
  },
  procedureResultEncounterRole: {
    _type: Type.String,
    _description: 'The encounter provider role UUID',
    _default: 'a0b03050-c99b-11e0-9572-0800200c9a66',
  },
  procedureConceptClassUuid: {
    _type: Type.String,
    _description: 'The procedure concept class UUID',
    _default: '8d490bf4-c2cc-11de-8d13-0010c6dffd0f',
  },
  careSettingUuid: {
    _type: Type.String,
    _description: 'The care setting UUID',
    _default: '6f0c9a92-6f24-11e3-af88-005056821db0',
  },
  serviceConceptSetUuid: {
    _type: Type.String,
    _description: 'The service concept set UUID',
    _default: '330c0ec6-0ac7-4b86-9c70-29d76f0ae20a',
  },
  otherReferralLocationUuid: {
    _type: Type.String,
    _description: 'The UUID for "Other" referral location',
    _default: '3476fd97-71da-4e9c-bf57-2b6318dc0c9f',
  },
  minorProcedureCategoryUuid: {
    _type: Type.String,
    _description: 'The UUID for Minor procedure category',
    _default: '3c3946b1-d71d-41b3-a2e4-2d755006200a',
  },
  majorProcedureCategoryUuid: {
    _type: Type.String,
    _description: 'The UUID for Major procedure category',
    _default: '3798940f-87b8-464e-b36a-17da246f034e',
  },
  hivClinicNoIdentifierTypeUuid: {
    _type: Type.String,
    _description: 'The UUID for HIV Clinic No. identifier type',
    _default: 'e1731641-30ab-102d-86b0-7a5022ba4115',
  },
  uicIdentifierTypeUuid: {
    _type: Type.String,
    _description: 'The UUID for Patient Unique Code (UIC) identifier type',
    _default: '877169c4-92c6-4cc9-bf45-1ab95faea242',
  },
  procedureResultFormUuid: {
    _type: Type.String,
    _description: 'The UUID for the procedure result form',
    _default: 'c6f3b5ad-b7eb-44ad-b212-fb26456e155b',
  },
  enableSendingLabTestsByEmail: {
    _type: Type.Boolean,
    _description: 'Enable sending lab tests by email',
    _default: false,
  },
  laboratoryEncounterTypeUuid: {
    _type: Type.String,
    _description: 'The UUID for laboratory encounter type',
    _default: '619d08fa-7186-11e3-bf7b-005056821db0',
  },
};

export interface OrderReason {
  labTestUuid: string;
  required: boolean;
  orderReasons: Array<string>;
}

export interface ConfigObject {
  procedureOrderTypeUuid: string;
  procedureConceptSetUuid: string;
  testOrderTypeUuid: string;
  labTestsWithOrderReasons: Array<OrderReason>;
  showPrintButton: boolean;
  orders: {
    labOrderTypeUuid: string;
    labOrderableConcepts: Array<string>;
  };
  procedureConceptClassUuid: string;
  conditionConceptClassUuid: string;
  procedureComplicationGroupingConceptUuid: string;
  procedureComplicationConceptUuid: string;
  procedureResultEncounterType: string;
  procedureResultEncounterRole: string;
  careSettingUuid: string;
  serviceConceptSetUuid: string;
  otherReferralLocationUuid: string;
  minorProcedureCategoryUuid: string;
  majorProcedureCategoryUuid: string;
  hivClinicNoIdentifierTypeUuid: string;
  uicIdentifierTypeUuid: string;
  procedureResultFormUuid: string;
  enableSendingLabTestsByEmail: boolean;
  laboratoryEncounterTypeUuid: string;
  enableSpecimenIdAutoGeneration: boolean;
}

export const StringPath =
  'M24 9.4L22.6 8 16 14.6 9.4 8 8 9.4 14.6 16 8 22.6 9.4 24 16 17.4 22.6 24 24 22.6 17.4 16 24 9.4z';
