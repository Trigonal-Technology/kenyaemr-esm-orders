import React, { type ComponentProps, useMemo, useState } from 'react';
import classNames from 'classnames';
import { capitalize } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { Button } from '@carbon/react';
import {
  age,
  ArrowLeftIcon,
  getPatientName,
  formatDate,
  parseDate,
  useLayoutType,
  useConfig,
  Workspace2,
  type Visit,
  type Workspace2DefinitionProps,
} from '@openmrs/esm-framework';
import { useOrderType, type OrderBasketItem } from '@openmrs/esm-patient-common-lib';
import type { MedicalSupplyOrderBasketItem } from '../../../types';
import { type MedicalSupplyConfig } from '../../../config-schema';
import { MedicalSupplyOrderForm } from './medical-supply-form.component';
import { MedicalSupplyTypeSearch } from './medical-supply-type-search';
import styles from './add-medical-supply-order.scss';

export interface AddMedicalSupplyProps {
  initialOrder?: OrderBasketItem;
  orderToEditOrdererUuid?: string;
  orderTypeUuid: string;
  patient: fhir.Patient;
  visitContext: Visit;
  closeWorkspace: Workspace2DefinitionProps['closeWorkspace'];
}

const AddMedicalSupplyOrder: React.FC<AddMedicalSupplyProps> = ({
  patient,
  orderToEditOrdererUuid,
  visitContext,
  initialOrder,
  orderTypeUuid,
  closeWorkspace,
}) => {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const [currentMedicalSupplyOrder, setCurrentMedicalSupplyOrder] = useState(initialOrder as MedicalSupplyOrderBasketItem);
  const { orders } = useConfig<MedicalSupplyConfig>();
  const { orderType } = useOrderType(orderTypeUuid);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const title = useMemo(() => {
    if (orderType) {
      if (initialOrder?.action == 'REVISE') {
        return t(`editOrderableForOrderType`, 'Edit {{orderTypeDisplay}}', {
          orderTypeDisplay: orderType.display.toLocaleLowerCase(),
        });
      } else {
        return t(`addOrderableForOrderType`, 'Add {{orderTypeDisplay}}', {
          orderTypeDisplay: orderType.display.toLocaleLowerCase(),
        });
      }
    } else {
      return '';
    }
  }, [orderType, t, initialOrder?.action]);

  const patientName = patient ? getPatientName(patient) : '';

  return (
    <Workspace2 title={title} hasUnsavedChanges={hasUnsavedChanges}>
      <div className={styles.container}>
        {isTablet && (
          <div className={styles.patientHeader}>
            <span className={styles.bodyShort02}>{patientName}</span>
            <span className={classNames(styles.text02, styles.bodyShort01)}>
              {capitalize(patient?.gender)} &middot; {age(patient?.birthDate)} &middot;{' '}
              <span>{formatDate(parseDate(patient?.birthDate), { mode: 'wide', time: false })}</span>
            </span>
          </div>
        )}
        {!isTablet && (
          <div className={styles.backButton}>
            <Button
              kind="ghost"
              renderIcon={(props: ComponentProps<typeof ArrowLeftIcon>) => <ArrowLeftIcon size={24} {...props} />}
              iconDescription={t('back', 'Back')}
              size="sm"
              onClick={() => closeWorkspace()}
            >
              <span>{t('back', 'Back')}</span>
            </Button>
          </div>
        )}
        {currentMedicalSupplyOrder ? (
          <MedicalSupplyOrderForm
            initialOrder={currentMedicalSupplyOrder}
            closeWorkspace={closeWorkspace}
            orderTypeUuid= {orderTypeUuid}
            setHasUnsavedChanges={setHasUnsavedChanges}
            patient={patient}
          />
        ) : (
          <MedicalSupplyTypeSearch
            orderTypeUuid={orderTypeUuid}
            openLabForm={setCurrentMedicalSupplyOrder}
            closeWorkspace={closeWorkspace}
            patient={patient}
            visit={visitContext}
          />
        )}
      </div>
    </Workspace2>
  );
};

export default AddMedicalSupplyOrder;
