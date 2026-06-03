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
import type { BedOrderBasketItem } from '../../../types';
import { type BedOrderConfig } from '../../../config-schema';
import { BedOrderForm } from './bed-form.component';
import { BedTypeSearch } from './bed-type-search';
import styles from './add-bed-order.scss';

export interface AddBedProps {
  initialOrder?: OrderBasketItem;
  orderToEditOrdererUuid?: string;
  orderTypeUuid: string;
  patient: fhir.Patient;
  visitContext: Visit;
  closeWorkspace: Workspace2DefinitionProps['closeWorkspace'];
}

const AddBedOrder: React.FC<AddBedProps> = ({
  patient,
  orderToEditOrdererUuid,
  visitContext,
  initialOrder,
  orderTypeUuid,
  closeWorkspace,
}) => {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const [currentBedOrder, setCurrentBedOrder] = useState(initialOrder as BedOrderBasketItem);
  const { orders } = useConfig<BedOrderConfig>();
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
        {currentBedOrder ? (
          <BedOrderForm
            initialOrder={currentBedOrder}
            closeWorkspace={closeWorkspace}
            orderTypeUuid={orderTypeUuid}
            setHasUnsavedChanges={setHasUnsavedChanges}
            patient={patient}
          />
        ) : (
          <BedTypeSearch
            orderTypeUuid={orderTypeUuid}
            openLabForm={setCurrentBedOrder}
            closeWorkspace={closeWorkspace}
            patient={patient}
            visit={visitContext}
          />
        )}
      </div>
    </Workspace2>
  );
};

export default AddBedOrder;
