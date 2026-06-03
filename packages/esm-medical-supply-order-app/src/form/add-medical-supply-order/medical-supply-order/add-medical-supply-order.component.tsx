import React, { type ComponentProps, useMemo, useState, useCallback } from 'react';
import classNames from 'classnames';
import { capitalize } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { Button, ButtonSet, InlineLoading } from '@carbon/react';
import {
  age,
  ArrowLeftIcon,
  getPatientName,
  formatDate,
  parseDate,
  useLayoutType,
  useConfig,
  useSession,
  openmrsFetch,
  restBaseUrl,
  showSnackbar,
  Workspace2,
  type Visit,
  type Workspace2DefinitionProps,
} from '@openmrs/esm-framework';
import { useOrderType, type OrderBasketItem, useOrderBasket, postOrder, showOrderSuccessToast } from '@openmrs/esm-patient-common-lib';
import type { MedicalSupplyOrderBasketItem } from '../../../types';
import { type MedicalSupplyConfig } from '../../../config-schema';
import { MedicalSupplyOrderForm } from './medical-supply-form.component';
import { MedicalSupplyTypeSearch } from './medical-supply-type-search';
import { usePatientMedicalSupplyOrders } from '../../../hooks/usePatientMedicalSupplyOrders';
import { createPrepMedicalSupplyPostData } from '../api';
import { moduleName } from '../../../constants';
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
  const session = useSession();
  const [currentMedicalSupplyOrder, setCurrentMedicalSupplyOrder] = useState(initialOrder as MedicalSupplyOrderBasketItem);
  const config = useConfig<MedicalSupplyConfig>();
  const fullConfig = useConfig<any>();
  const { orders: configOrders, careSettingUuid } = config;
  const { orderType } = useOrderType(orderTypeUuid);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSavingOrders, setIsSavingOrders] = useState(false);
  const { mutate: mutateOrders } = usePatientMedicalSupplyOrders(patient?.id);

  const { orders: basketOrders, clearOrders } = useOrderBasket<MedicalSupplyOrderBasketItem>(
    patient,
    orderTypeUuid,
    createPrepMedicalSupplyPostData(configOrders.medicalSupplyOrderTypeUuid, careSettingUuid)
  );

  const handleCancel = useCallback(() => {
    closeWorkspace();
  }, [closeWorkspace]);

  const handleSave = useCallback(async () => {
    setIsSavingOrders(true);
    try {
      const patientId = (patient as any)?.uuid || (patient as any)?.id;
      const orderLocationUuid = session?.sessionLocation?.uuid;
      const ordererUuid = session?.currentProvider?.uuid;
      const orderEncounterType = fullConfig.orderEncounterType || '39da3525-afe4-45ff-8977-c53b7b359158';

      const encounterPayload = {
        patient: patientId,
        encounterType: orderEncounterType,
        visit: (visitContext as any)?.uuid,
        location: orderLocationUuid,
        orders: basketOrders.map(order => createPrepMedicalSupplyPostData(
          configOrders.medicalSupplyOrderTypeUuid,
          careSettingUuid
        )(order, patientId, null as any)), // Implicitly assigned
      };

      await openmrsFetch(`${restBaseUrl}/encounter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: encounterPayload,
      });

      showOrderSuccessToast(moduleName, basketOrders as any);
      clearOrders();
      mutateOrders();
      closeWorkspace({ discardUnsavedChanges: true });
    } catch (error) {
      showSnackbar({
        isLowContrast: false,
        kind: 'error',
        title: t('errorSavingOrder', 'Error saving order'),
        subtitle: (error as any)?.message || t('errorSavingOrder', 'Error saving order'),
      });
      console.error(error);
    } finally {
      setIsSavingOrders(false);
    }
  }, [basketOrders, patient, visitContext, fullConfig, configOrders.medicalSupplyOrderTypeUuid, careSettingUuid, session, clearOrders, mutateOrders, closeWorkspace, t]);

  const title = useMemo(() => {
    if (orderType) {
      if (initialOrder?.action == 'REVISE') {
        return t(`editOrderableForOrderTypee`, 'Edit {{orderTypeDisplay}}', {
          orderTypeDisplay: orderType.display.toLocaleLowerCase(),
        });
      } else {
        return t(`addOrderableForOrderTypee`, 'Add {{orderTypeDisplay}}', {
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
              onClick={() => closeWorkspace({ discardUnsavedChanges: true })}
            >
              <span>{t('back', 'Back')}</span>
            </Button>
          </div>
        )}
        <div className={styles.contentContainer}>
          {currentMedicalSupplyOrder ? (
            <MedicalSupplyOrderForm
              initialOrder={currentMedicalSupplyOrder}
              closeWorkspace={closeWorkspace}
              orderTypeUuid={orderTypeUuid}
              setHasUnsavedChanges={setHasUnsavedChanges}
              patient={patient}
              visit={visitContext}
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
        {!currentMedicalSupplyOrder && (
          <ButtonSet className={styles.buttonSet}>
            <Button className={styles.actionButton} kind="secondary" onClick={handleCancel}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button
              className={styles.actionButton}
              kind="primary"
              onClick={handleSave}
              disabled={isSavingOrders || !basketOrders?.length}
            >
              {isSavingOrders ? (
                <InlineLoading description={t('saving', 'Saving') + '...'} />
              ) : (
                <span>{t('signAndClose', 'Sign and close')}</span>
              )}
            </Button>
          </ButtonSet>
        )}
      </div>
    </Workspace2>
  );
};

export default AddMedicalSupplyOrder;
