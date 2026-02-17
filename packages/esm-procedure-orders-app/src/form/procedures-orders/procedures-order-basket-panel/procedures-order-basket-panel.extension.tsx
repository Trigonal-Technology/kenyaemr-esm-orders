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
import type { ProcedureOrderBasketItem } from '../../../types';
import type { ConfigObject } from '../../../config-schema';
import { ProceduresOrderBasketItemTile } from './procedures-order-basket-item-tile.component';
import { prepProceduresOrderPostData } from '../api';
import ProcedureIcon from './procedures-icon.component';
import styles from './procedures-order-basket-panel.scss';

/**
 * The extension is slotted into order-basket-slot in the main Order Basket workspace by default.
 * It renders the "Add +" button for imaging orders, and lists pending imaging orders in the order basket.
 *
 * Designs: https://app.zeplin.io/project/60d59321e8100b0324762e05/screen/648c44d9d4052c613e7f23da
 */
export function ProceduresOrderBasketPanelExtension({ patient }: OrderBasketExtensionProps) {
  const config = useConfig<ConfigObject>();
  const { t } = useTranslation();

  const launchProceduresOrderForm = useCallback((orderTypeUuid: string, order?: ProcedureOrderBasketItem) => {
    launchWorkspace2('add-procedures-order', { orderTypeUuid, order }, null, null);
  }, []);

  const allOrderTypes: any = [
    {
      label: t('procedureOrders', 'Procedure orders'),
      orderTypeUuid: config.procedureOrderTypeUuid,
      icon: 'omrs-icon-lab-order',
    },
  ];

  return (
    <>
      {allOrderTypes.map((orderTypeConfig) => (
        <ProceduresOrderBasketPanel
          key={orderTypeConfig.orderTypeUuid}
          patient={patient}
          {...orderTypeConfig}
          launchProceduresOrderForm={launchProceduresOrderForm}
        />
      ))}
    </>
  );
}

type OrderTypeConfig = any;

interface ProceduresOrderBasketPanelProps extends OrderTypeConfig {
  patient: fhir.Patient;
  launchProceduresOrderForm(orderTypeUuid: string, order?: ProcedureOrderBasketItem): void;
}

function ProceduresOrderBasketPanel({
  orderTypeUuid,
  label,
  icon,
  patient,
  launchProceduresOrderForm,
}: ProceduresOrderBasketPanelProps) {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const responsiveSize = isTablet ? 'md' : 'sm';
  const isDefaultLabOrder = icon === 'omrs-icon-lab-order';
  const { orderType, isLoadingOrderType } = useOrderType(orderTypeUuid);
  const config = useConfig<ConfigObject>();
  const { orders, setOrders } = useOrderBasket<ProcedureOrderBasketItem>(patient, orderTypeUuid, (order, patientUuid, encounterUuid) =>
    prepProceduresOrderPostData(order, patientUuid, encounterUuid, config),
  );
  const [isExpanded, setIsExpanded] = useState(orders.length > 0);
  const {
    incompleteOrderBasketItems,
    newOrderBasketItems,
    renewedOrderBasketItems,
    revisedOrderBasketItems,
    discontinuedOrderBasketItems,
  } = useMemo(() => {
    const incompleteOrderBasketItems: Array<ProcedureOrderBasketItem> = [];
    const newOrderBasketItems: Array<ProcedureOrderBasketItem> = [];
    const renewedOrderBasketItems: Array<ProcedureOrderBasketItem> = [];
    const revisedOrderBasketItems: Array<ProcedureOrderBasketItem> = [];
    const discontinuedOrderBasketItems: Array<ProcedureOrderBasketItem> = [];

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
    (order: ProcedureOrderBasketItem) => {
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
            <ProcedureIcon isTablet={isTablet} />
          ) : (
            <MaybeIcon icon={icon ? icon : 'omrs-icon-generic-order-type'} size={isTablet ? 40 : 24} />
          )}
          <h4 className={styles.heading}>{`${label ? t(label) : orderType?.display} (${orders.length})`}</h4>
        </div>
        <div className={styles.buttonContainer}>
          <Button
            className={styles.addButton}
            iconDescription="Add procedure Order"
            kind="ghost"
            onClick={() => launchProceduresOrderForm(orderTypeUuid)}
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
                    <ProceduresOrderBasketItemTile
                      key={order.uuid}
                      onItemClick={() => launchProceduresOrderForm(orderTypeUuid, order)}
                      onRemoveClick={() => removeLabOrder(order)}
                      orderBasketItem={order}
                    />
                  ))}
                </>
              )}
              {newOrderBasketItems.length > 0 && (
                <>
                  {newOrderBasketItems.map((order) => (
                    <ProceduresOrderBasketItemTile
                      key={order.uuid}
                      onItemClick={() => launchProceduresOrderForm(orderTypeUuid, order)}
                      onRemoveClick={() => removeLabOrder(order)}
                      orderBasketItem={order}
                    />
                  ))}
                </>
              )}

              {renewedOrderBasketItems.length > 0 && (
                <>
                  {renewedOrderBasketItems.map((order) => (
                    <ProceduresOrderBasketItemTile
                      key={order.uuid}
                      onItemClick={() => launchProceduresOrderForm(orderTypeUuid, order)}
                      onRemoveClick={() => removeLabOrder(order)}
                      orderBasketItem={order}
                    />
                  ))}
                </>
              )}

              {revisedOrderBasketItems.length > 0 && (
                <>
                  {revisedOrderBasketItems.map((order) => (
                    <ProceduresOrderBasketItemTile
                      key={order.uuid}
                      onItemClick={() => launchProceduresOrderForm(orderTypeUuid, order)}
                      onRemoveClick={() => removeLabOrder(order)}
                      orderBasketItem={order}
                    />
                  ))}
                </>
              )}

              {discontinuedOrderBasketItems.length > 0 && (
                <>
                  {discontinuedOrderBasketItems.map((order) => (
                    <ProceduresOrderBasketItemTile
                      key={order.uuid}
                      onItemClick={() => launchProceduresOrderForm(orderTypeUuid, order)}
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

export default ProceduresOrderBasketPanelExtension;

