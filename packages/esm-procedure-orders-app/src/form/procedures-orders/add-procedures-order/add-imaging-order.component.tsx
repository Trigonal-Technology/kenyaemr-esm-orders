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
import type { ProcedureOrderBasketItem } from '../../../types';
import { ConfigObject } from '../../../config-schema';
import { ProceduresOrderForm } from './procedures-order-form.component';
import { TestTypeSearch } from './procedures-type-search';
import { usePatientProcedureOrders } from '../../../hooks/usePatientProcedureOrders';
import { prepProceduresOrderPostData } from '../api';
import { moduleName } from '../../../constants';
import styles from './add-procedures-order.scss';

export interface AddImagingOrderProps {
  initialOrder?: OrderBasketItem;

  /**
   * This field should only be supplied for an existing order saved to the backend
   */
  orderToEditOrdererUuid?: string;
  orderTypeUuid: string;
  patient: fhir.Patient;
  visitContext: Visit;
  closeWorkspace: Workspace2DefinitionProps['closeWorkspace'];
}

const AddImagingOrder: React.FC<AddImagingOrderProps> = ({
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
  const [currentLabOrder, setCurrentLabOrder] = useState(initialOrder as ProcedureOrderBasketItem);
  const config = useConfig<ConfigObject>();
  const { orders } = config;
  const { orderType } = useOrderType(orderTypeUuid);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSavingOrders, setIsSavingOrders] = useState(false);
  const { mutate: mutateOrders } = usePatientProcedureOrders(patient?.id);

  const { orders: basketOrders, clearOrders } = useOrderBasket<ProcedureOrderBasketItem>(
    patient,
    orderTypeUuid,
    (order, patientUuid, encounterUuid) => prepProceduresOrderPostData(order, patientUuid, encounterUuid, config)
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
      const orderEncounterType = (config as any).orderEncounterType || '39da3525-afe4-45ff-8977-c53b7b359158';
      
      const encounterPayload = {
        patient: patientId,
        encounterType: orderEncounterType,
        visit: (visitContext as any)?.uuid,
        location: orderLocationUuid,
        orders: basketOrders.map(order => prepProceduresOrderPostData(
          order,
          patientId,
          null as any, // The encounter will be implicitly assigned
          config
        )),
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
  }, [basketOrders, patient, visitContext, config, session, clearOrders, mutateOrders, closeWorkspace, t]);

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

  // const orderableConceptSets = useMemo(() => {
  //   const allOrderTypes: ImagingConfig['additionalTestOrderTypes'] = [
  //     {
  //       label: t('radiologyOrders', 'Radiology Orders'),
  //       orderTypeUuid: orders.radiologyOrderTypeUuid,
  //       orderableConceptSets: orders.labOrderableConcepts,
  //     },
  //     ...additionalTestOrderTypes,
  //   ];
  //   return allOrderTypes.find((orderType) => orderType.orderTypeUuid === orderTypeUuid).orderableConceptSets;
  // }, [additionalTestOrderTypes, orderTypeUuid, orders.radiologyOrderTypeUuid, orders.labOrderableConcepts, t]);

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
          {currentLabOrder ? (
            <ProceduresOrderForm
              initialOrder={currentLabOrder}
              closeWorkspace={closeWorkspace}
              orderTypeUuid= {orderTypeUuid}
              setHasUnsavedChanges={setHasUnsavedChanges}
              patient={patient}
              visit={visitContext}
            />
          ) : (
            <TestTypeSearch
              orderTypeUuid={orderTypeUuid}
              openLabForm={setCurrentLabOrder}
              closeWorkspace={closeWorkspace}
              patient={patient}
              visit={visitContext}
            />
          )}
        </div>
        {!currentLabOrder && (
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

export default AddImagingOrder;
