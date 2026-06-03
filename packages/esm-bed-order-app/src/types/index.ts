import { type OrderUrgency, type OrderBasketItem } from '@openmrs/esm-patient-common-lib';

export interface Concept {
  uuid: string;
  display: string;
  setMembers: [];
}

export interface BedOrderBasketItem extends OrderBasketItem {
  testType?: {
    label: string;
    conceptUuid: string;
  };
  urgency?: OrderUrgency;
  instructions?: string;
  quantity?: number;
  quantityUnits?: string;
  previousOrder?: string;
  brandName?: string;
  orderer?: string;
  careSetting?: string;
  admissionDate?: Date;
  ward?: string;
  admissionReason?: string;
}

export type OrderFrequency = CommonBedOrderValueCoded;
export type DurationUnit = CommonBedOrderValueCoded;

interface CommonBedOrderProps {
  value: string;
  default?: boolean;
}

export interface CommonBedOrderValueCoded extends CommonBedOrderProps {
  valueCoded: string;
}

export interface Concept {
  display: string;
  uuid: string;
}
export interface BedOrder {
  concept: {
    uuid: string;
    display: string;
  };
  conceptName: {
    uuid: string;
    display: string;
  };
  display: string;
}
