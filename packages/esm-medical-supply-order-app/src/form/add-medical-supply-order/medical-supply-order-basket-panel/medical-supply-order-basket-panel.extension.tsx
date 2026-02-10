import React, { type ComponentProps, useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Button, Tile } from '@carbon/react';
import { AddIcon, ChevronDownIcon, ChevronUpIcon, useLayoutType, useConfig, MaybeIcon, launchWorkspace2 } from '@openmrs/esm-framework';
import {
  useOrderBasket,
  useOrderType,
  type OrderBasketExtensionProps,
} from '@openmrs/esm-patient-common-lib';
import type { MedicalSupplyOrderBasketItem } from '../../../types';
import type { MedicalSupplyConfig } from '../../../config-schema';
import { MedicalSupplyOrderBasketItemTile } from './medical-supply-order-basket-item-tile.component';
import { createPrepMedicalSupplyPostData } from '../api';
import MedicalSupplyIcon from './medical-supply-icon.component';
import styles from './medical-supply-order-basket-panel.scss';

export function MedicalSupplBasketPanelExtension({ patient }: OrderBasketExtensionProps) {
  const { orders } = useConfig<MedicalSupplyConfig>();
  const { t } = useTranslation();

  const launchMedicalSupplyForm = useCallback((orderTypeUuid: string, order?: MedicalSupplyOrderBasketItem) => {
    launchWorkspace2('add-medical-supply-order', { orderTypeUuid, order }, null, null);
  }, []);

  const allOrderTypes: any = [
    {
      label: t('medicalSupplyOrders', 'Medical supply orders'),
      orderTypeUuid: orders.medicalSupplyOrderTypeUuid,
      icon: 'omrs-icon-lab-order',
    },
  ];

  return (
    <>
      {allOrderTypes.map((orderTypeConfig) => (
        <MedicalSupplyBasketPanel
          key={orderTypeConfig.orderTypeUuid}
          patient={patient}
          {...orderTypeConfig}
          launchMedicalSupplyForm={launchMedicalSupplyForm}
        />
      ))}
    </>
  );
}

type OrderTypeConfig = any;

interface MedicalSupplyBasketPanelProps extends OrderTypeConfig {
  patient: fhir.Patient;
  launchMedicalSupplyForm(orderTypeUuid: string, order?: MedicalSupplyOrderBasketItem): void;
}

function MedicalSupplyBasketPanel({ orderTypeUuid, label, icon, patient, launchMedicalSupplyForm }: MedicalSupplyBasketPanelProps) {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const responsiveSize = isTablet ? 'md' : 'sm';
  const isDefaultLabOrder = icon === 'omrs-icon-lab-order';
  const { orderType, isLoadingOrderType } = useOrderType(orderTypeUuid);
  const { orders: configOrders, careSettingUuid } = useConfig<MedicalSupplyConfig>();
  const { orders, setOrders } = useOrderBasket<MedicalSupplyOrderBasketItem>(
    patient,
    orderTypeUuid,
    createPrepMedicalSupplyPostData(configOrders.medicalSupplyOrderTypeUuid, careSettingUuid),
  );
  const [isExpanded, setIsExpanded] = useState(orders.length > 0);
  const {
    incompleteOrderBasketItems,
    newOrderBasketItems,
    renewedOrderBasketItems,
    revisedOrderBasketItems,
    discontinuedOrderBasketItems,
  } = useMemo(() => {
    const incompleteOrderBasketItems: Array<MedicalSupplyOrderBasketItem> = [];
    const newOrderBasketItems: Array<MedicalSupplyOrderBasketItem> = [];
    const renewedOrderBasketItems: Array<MedicalSupplyOrderBasketItem> = [];
    const revisedOrderBasketItems: Array<MedicalSupplyOrderBasketItem> = [];
    const discontinuedOrderBasketItems: Array<MedicalSupplyOrderBasketItem> = [];

    // Filter out any undefined or null orders to prevent errors
    orders.filter(Boolean).forEach((order) => {
      if (order?.isOrderIncomplete) {
        incompleteOrderBasketItems.push(order);
      } else if (order.action === 'NEW') {
        newOrderBasketItems.push(order);
      } else if (order.action === 'RENEW') {
        renewedOrderBasketItems.push(order);
      } else if (order.action === 'REVISE') {
        revisedOrderBasketItems.push(order);
      } else if (order.action === 'DISCONTINUE') {
        discontinuedOrderBasketItems.push(order);
      }
    });

    return {
      incompleteOrderBasketItems,
      newOrderBasketItems,
      renewedOrderBasketItems,
      revisedOrderBasketItems,
      discontinuedOrderBasketItems,
    };
  }, [orders]);

  const removeLabOrder = useCallback(
    (order: MedicalSupplyOrderBasketItem) => {
      const newOrders = [...orders];
      newOrders.splice(orders.indexOf(order), 1);
      setOrders(newOrders);
    },
    [orders, setOrders],
  );

  useEffect(() => {
    setIsExpanded(orders.length > 0);
  }, [orders]);

  return (
    <Tile
      className={classNames(styles.tile, isTablet ? styles.tabletTile : styles.desktopTile, {
        [styles.collapsedTile]: !isExpanded,
      })}
    >
      <div className={classNames(isTablet ? styles.tabletContainer : styles.desktopContainer)}>
        <div className={styles.iconAndLabel}>
          {isDefaultLabOrder ? (
            <MedicalSupplyIcon isTablet={isTablet} />
          ) : (
            <MaybeIcon icon={icon ? icon : 'omrs-icon-generic-order-type'} size={isTablet ? 40 : 24} />
          )}
          <h4 className={styles.heading}>{`${label ? t(label) : orderType?.display} (${orders.length})`}</h4>
        </div>
        <div className={styles.buttonContainer}>
          <Button
            className={styles.addButton}
            iconDescription="Add Medical Supply"
            kind="ghost"
            onClick={() => launchMedicalSupplyForm(orderTypeUuid)}
            renderIcon={(props: ComponentProps<typeof AddIcon>) => <AddIcon size={16} {...props} />}
            size={responsiveSize}
          >
            {t('add', 'Add')}
          </Button>
          <Button
            className={styles.chevron}
            disabled={orders.length === 0}
            hasIconOnly
            iconDescription="View"
            kind="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            renderIcon={(props: ComponentProps<typeof ChevronUpIcon>) =>
              isExpanded ? <ChevronUpIcon size={16} {...props} /> : <ChevronDownIcon size={16} {...props} />
            }
            size={responsiveSize}
          >
            {t('add', 'Add')}
          </Button>
        </div>
      </div>
      {isExpanded && (
        <>
          {orders.length > 0 && (
            <>
              {incompleteOrderBasketItems.length > 0 && (
                <>
                  {incompleteOrderBasketItems.map((order) => (
                    <MedicalSupplyOrderBasketItemTile
                      key={order.uuid}
                      onItemClick={() => launchMedicalSupplyForm(orderTypeUuid, order)}
                      onRemoveClick={() => removeLabOrder(order)}
                      orderBasketItem={order}
                    />
                  ))}
                </>
              )}
              {newOrderBasketItems.length > 0 && (
                <>
                  {newOrderBasketItems.map((order) => (
                    <MedicalSupplyOrderBasketItemTile
                      key={order.uuid}
                      onItemClick={() => launchMedicalSupplyForm(orderTypeUuid, order)}
                      onRemoveClick={() => removeLabOrder(order)}
                      orderBasketItem={order}
                    />
                  ))}
                </>
              )}

              {renewedOrderBasketItems.length > 0 && (
                <>
                  {renewedOrderBasketItems.map((order) => (
                    <MedicalSupplyOrderBasketItemTile
                      key={order.uuid}
                      onItemClick={() => launchMedicalSupplyForm(orderTypeUuid, order)}
                      onRemoveClick={() => removeLabOrder(order)}
                      orderBasketItem={order}
                    />
                  ))}
                </>
              )}

              {revisedOrderBasketItems.length > 0 && (
                <>
                  {revisedOrderBasketItems.map((order) => (
                    <MedicalSupplyOrderBasketItemTile
                      key={order.uuid}
                      onItemClick={() => launchMedicalSupplyForm(orderTypeUuid, order)}
                      onRemoveClick={() => removeLabOrder(order)}
                      orderBasketItem={order}
                    />
                  ))}
                </>
              )}

              {discontinuedOrderBasketItems.length > 0 && (
                <>
                  {discontinuedOrderBasketItems.map((order) => (
                    <MedicalSupplyOrderBasketItemTile
                      key={order.uuid}
                      onItemClick={() => launchMedicalSupplyForm(orderTypeUuid, order)}
                      onRemoveClick={() => removeLabOrder(order)}
                      orderBasketItem={order}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </>
      )}
    </Tile>
  );
}

export default MedicalSupplBasketPanelExtension;

