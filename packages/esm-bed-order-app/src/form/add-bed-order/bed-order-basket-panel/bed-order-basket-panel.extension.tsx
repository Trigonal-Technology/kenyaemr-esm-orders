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
import type { BedOrderBasketItem } from '../../../types';
import type { BedOrderConfig } from '../../../config-schema';
import { BedOrderBasketItemTile } from './bed-order-basket-item-tile.component';
import { createPrepBedOrderPostData } from '../api';
import BedIcon from './bed-icon.component';
import styles from './bed-order-basket-panel.scss';

export function BedBasketPanelExtension({ patient }: OrderBasketExtensionProps) {
  const { orders } = useConfig<BedOrderConfig>();
  const { t } = useTranslation();

  const launchBedOrderForm = useCallback((orderTypeUuid: string, order?: BedOrderBasketItem) => {
    launchWorkspace2('add-bed-order', { orderTypeUuid, order }, null, null);
  }, []);

  const allOrderTypes: any = [
    {
      label: t('bedOrders', 'Bed orders'),
      orderTypeUuid: orders.bedOrderTypeUuid,
      icon: 'omrs-icon-lab-order',
    },
  ];

  return (
    <>
      {allOrderTypes.map((orderTypeConfig) => (
        <BedBasketPanel
          key={orderTypeConfig.orderTypeUuid}
          patient={patient}
          {...orderTypeConfig}
          launchBedOrderForm={launchBedOrderForm}
        />
      ))}
    </>
  );
}

type OrderTypeConfig = any;

interface BedBasketPanelProps extends OrderTypeConfig {
  patient: fhir.Patient;
  launchBedOrderForm(orderTypeUuid: string, order?: BedOrderBasketItem): void;
}

function BedBasketPanel({ orderTypeUuid, label, icon, patient, launchBedOrderForm }: BedBasketPanelProps) {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const responsiveSize = isTablet ? 'md' : 'sm';
  const isDefaultBedOrder = icon === 'omrs-icon-lab-order';
  const { orderType, isLoadingOrderType } = useOrderType(orderTypeUuid);
  const { orders: configOrders, careSettingUuid } = useConfig<BedOrderConfig>();
  const { orders, setOrders } = useOrderBasket<BedOrderBasketItem>(
    patient,
    orderTypeUuid,
    createPrepBedOrderPostData(configOrders.bedOrderTypeUuid, careSettingUuid),
  );
  const [isExpanded, setIsExpanded] = useState(orders.length > 0);
  const {
    incompleteOrderBasketItems,
    newOrderBasketItems,
    renewedOrderBasketItems,
    revisedOrderBasketItems,
    discontinuedOrderBasketItems,
  } = useMemo(() => {
    const incompleteOrderBasketItems: Array<BedOrderBasketItem> = [];
    const newOrderBasketItems: Array<BedOrderBasketItem> = [];
    const renewedOrderBasketItems: Array<BedOrderBasketItem> = [];
    const revisedOrderBasketItems: Array<BedOrderBasketItem> = [];
    const discontinuedOrderBasketItems: Array<BedOrderBasketItem> = [];

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

  const removeBedOrder = useCallback(
    (order: BedOrderBasketItem) => {
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
          {isDefaultBedOrder ? (
            <BedIcon isTablet={isTablet} />
          ) : (
            <MaybeIcon icon={icon ? icon : 'omrs-icon-generic-order-type'} size={isTablet ? 40 : 24} />
          )}
          <h4 className={styles.heading}>{`${label ? t(label) : orderType?.display} (${orders.length})`}</h4>
        </div>
        <div className={styles.buttonContainer}>
          <Button
            className={styles.addButton}
            iconDescription="Add Bed Order"
            kind="ghost"
            onClick={() => launchBedOrderForm(orderTypeUuid)}
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
                    <BedOrderBasketItemTile
                      key={order.uuid}
                      onItemClick={() => launchBedOrderForm(orderTypeUuid, order)}
                      onRemoveClick={() => removeBedOrder(order)}
                      orderBasketItem={order}
                    />
                  ))}
                </>
              )}
              {newOrderBasketItems.length > 0 && (
                <>
                  {newOrderBasketItems.map((order) => (
                    <BedOrderBasketItemTile
                      key={order.uuid}
                      onItemClick={() => launchBedOrderForm(orderTypeUuid, order)}
                      onRemoveClick={() => removeBedOrder(order)}
                      orderBasketItem={order}
                    />
                  ))}
                </>
              )}

              {renewedOrderBasketItems.length > 0 && (
                <>
                  {renewedOrderBasketItems.map((order) => (
                    <BedOrderBasketItemTile
                      key={order.uuid}
                      onItemClick={() => launchBedOrderForm(orderTypeUuid, order)}
                      onRemoveClick={() => removeBedOrder(order)}
                      orderBasketItem={order}
                    />
                  ))}
                </>
              )}

              {revisedOrderBasketItems.length > 0 && (
                <>
                  {revisedOrderBasketItems.map((order) => (
                    <BedOrderBasketItemTile
                      key={order.uuid}
                      onItemClick={() => launchBedOrderForm(orderTypeUuid, order)}
                      onRemoveClick={() => removeBedOrder(order)}
                      orderBasketItem={order}
                    />
                  ))}
                </>
              )}

              {discontinuedOrderBasketItems.length > 0 && (
                <>
                  {discontinuedOrderBasketItems.map((order) => (
                    <BedOrderBasketItemTile
                      key={order.uuid}
                      onItemClick={() => launchBedOrderForm(orderTypeUuid, order)}
                      onRemoveClick={() => removeBedOrder(order)}
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

export default BedBasketPanelExtension;

