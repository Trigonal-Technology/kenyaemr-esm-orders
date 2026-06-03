// import React, { type ComponentProps, useCallback, useEffect, useMemo, useState } from 'react';
// import classNames from 'classnames';
// import { useTranslation } from 'react-i18next';
// import { Button, Tile } from '@carbon/react';
// import { Add, ChevronDown, ChevronUp } from '@carbon/react/icons';
// import { useLayoutType, useConfig, MaybeIcon, launchWorkspace } from '@openmrs/esm-framework';
// import { type OrderBasketItem, useOrderBasket, useOrderType } from '@openmrs/esm-patient-common-lib';
// import { ImagingOrderBasketItemTile } from './imaging-order-basket-item-tile.component';
// import { prepImagingOrderPostData } from '../api';
// import ImagingIcon from './imaging-icon.component';
// import styles from './imaging-order-basket-panel.scss';
// import { type ImagingOrderBasketItem } from '../../../types';
// import type { ImagingConfig } from '../../../config-schema';

// /**
//  * The extension is slotted into order-basket-slot in the main Order Basket workspace.
//  * It renders the "Add +" button for imaging orders, and lists pending imaging orders in the order basket.
//  *
//  * Designs: https://app.zeplin.io/project/60d59321e8100b0324762e05/screen/648c44d9d4052c613e7f23da
//  */
// export default function ImagingOrderBasketPanelExtension({ patient }: { patient: fhir.Patient }) {
//   const { orders } = useConfig<ImagingConfig>();
//   const { t } = useTranslation();

//   const allOrderTypes = [
//     {
//       label: t('imagingOrders', 'Imaging orders'),
//       orderTypeUuid: orders.radiologyOrderTypeUuid,
//       icon: 'omrs-icon-radiology-order',
//     },
//   ];

//   return (
//     <>
//       {allOrderTypes.map((orderTypeConfig) => (
//         <ImagingOrderBasketPanel
//           key={orderTypeConfig.orderTypeUuid}
//           patient={patient}
//           {...orderTypeConfig}
//         />
//       ))}
//     </>
//   );
// }

// interface ImagingOrderBasketPanelProps {
//   orderTypeUuid: string;
//   label: string;
//   icon: string;
//   patient: fhir.Patient;
// }

// function ImagingOrderBasketPanel({ orderTypeUuid, label, icon, patient }: ImagingOrderBasketPanelProps) {
//   const { t } = useTranslation();
//   const isTablet = useLayoutType() === 'tablet';
//   const responsiveSize = isTablet ? 'md' : 'sm';
//   const isDefaultImagingOrder = icon === 'omrs-icon-radiology-order';
//   const { orderType, isLoadingOrderType } = useOrderType(orderTypeUuid);
//   const { orders, setOrders } = useOrderBasket<ImagingOrderBasketItem>(patient, orderTypeUuid, prepImagingOrderPostData);
//   const [isExpanded, setIsExpanded] = useState(orders.length > 0);
//   const {
//     incompleteOrderBasketItems,
//     newOrderBasketItems,
//     renewedOrderBasketItems,
//     revisedOrderBasketItems,
//     discontinuedOrderBasketItems,
//   } = useMemo(() => {
//     const incompleteOrderBasketItems: Array<ImagingOrderBasketItem> = [];
//     const newOrderBasketItems: Array<ImagingOrderBasketItem> = [];
//     const renewedOrderBasketItems: Array<ImagingOrderBasketItem> = [];
//     const revisedOrderBasketItems: Array<ImagingOrderBasketItem> = [];
//     const discontinuedOrderBasketItems: Array<ImagingOrderBasketItem> = [];

//     orders.forEach((order) => {
//       if (order?.isOrderIncomplete) {
//         incompleteOrderBasketItems.push(order);
//       } else if (order.action === 'NEW') {
//         newOrderBasketItems.push(order);
//       } else if (order.action === 'RENEW') {
//         renewedOrderBasketItems.push(order);
//       } else if (order.action === 'REVISE') {
//         revisedOrderBasketItems.push(order);
//       } else if (order.action === 'DISCONTINUE') {
//         discontinuedOrderBasketItems.push(order);
//       }
//     });

//     return {
//       incompleteOrderBasketItems,
//       newOrderBasketItems,
//       renewedOrderBasketItems,
//       revisedOrderBasketItems,
//       discontinuedOrderBasketItems,
//     };
//   }, [orders]);

//   const launchImagingOrderForm = useCallback((orderTypeUuid: string, order?: OrderBasketItem) => {
//     launchWorkspace('add-imaging-order', { order });
//   }, []);

//   const removeImagingOrder = useCallback(
//     (order: ImagingOrderBasketItem) => {
//       const newOrders = [...orders];
//       newOrders.splice(orders.indexOf(order), 1);
//       setOrders(newOrders);
//     },
//     [orders, setOrders],
//   );

//   useEffect(() => {
//     setIsExpanded(orders.length > 0);
//   }, [orders]);

//   if (isLoadingOrderType) {
//     return null;
//   }

//   return (
//     <Tile
//       className={classNames(isTablet ? styles.tabletTile : styles.desktopTile, {
//         [styles.collapsedTile]: !isExpanded,
//       })}>
//       <div className={styles.container}>
//         <div className={styles.iconAndLabel}>
//           {isDefaultImagingOrder ? (
//             <ImagingIcon isTablet={isTablet} />
//           ) : (
//             <MaybeIcon icon={icon ? icon : 'omrs-icon-generic-order-type'} size={isTablet ? 40 : 24} />
//           )}
//           <h4 className={styles.heading}>{`${label ? t(label) : orderType?.display} (${orders.length})`}</h4>
//         </div>
//         <div className={styles.buttonContainer}>
//           <Button
//             kind="ghost"
//             renderIcon={(props) => <Add size={16} {...props} />}
//             iconDescription="Add imaging order"
//             onClick={() => launchImagingOrderForm(orderTypeUuid)}
//             size={responsiveSize}>
//             {t('add', 'Add')}
//           </Button>
//           <Button
//             className={styles.chevron}
//             hasIconOnly
//             kind="ghost"
//             renderIcon={(props) =>
//               isExpanded ? <ChevronUp size={16} {...props} /> : <ChevronDown size={16} {...props} />
//             }
//             iconDescription="View"
//             disabled={orders.length === 0}
//             onClick={() => setIsExpanded(!isExpanded)}>
//             {t('add', 'Add')}
//           </Button>
//         </div>
//       </div>
//       {isExpanded && (
//         <>
//           {orders.length > 0 && (
//             <>
//               {incompleteOrderBasketItems.length > 0 && (
//                 <>
//                   {incompleteOrderBasketItems.map((order) => (
//                     <ImagingOrderBasketItemTile
//                       key={order.uuid}
//                       orderBasketItem={order}
//                       onItemClick={() => launchImagingOrderForm(orderTypeUuid,order)}
//                       onRemoveClick={() => removeImagingOrder(order)}
//                     />
//                   ))}
//                 </>
//               )}
//               {newOrderBasketItems.length > 0 && (
//                 <>
//                   {newOrderBasketItems.map((order) => (
//                     <ImagingOrderBasketItemTile
//                       key={order.uuid}
//                       orderBasketItem={order}
//                       onItemClick={() => launchImagingOrderForm(orderTypeUuid,order)}
//                       onRemoveClick={() => removeImagingOrder(order)}
//                     />
//                   ))}
//                 </>
//               )}

//               {renewedOrderBasketItems.length > 0 && (
//                 <>
//                   {renewedOrderBasketItems.map((order) => (
//                     <ImagingOrderBasketItemTile
//                       key={order.uuid}
//                       orderBasketItem={order}
//                       onItemClick={() => launchImagingOrderForm(orderTypeUuid,order)}
//                       onRemoveClick={() => removeImagingOrder(order)}
//                     />
//                   ))}
//                 </>
//               )}

//               {revisedOrderBasketItems.length > 0 && (
//                 <>
//                   {revisedOrderBasketItems.map((order) => (
//                     <ImagingOrderBasketItemTile
//                       key={order.uuid}
//                       orderBasketItem={order}
//                       onItemClick={() => launchImagingOrderForm(orderTypeUuid,order)}
//                       onRemoveClick={() => removeImagingOrder(order)}
//                     />
//                   ))}
//                 </>
//               )}

//               {discontinuedOrderBasketItems.length > 0 && (
//                 <>
//                   {discontinuedOrderBasketItems.map((order) => (
//                     <ImagingOrderBasketItemTile
//                       key={order.uuid}
//                       orderBasketItem={order}
//                       onItemClick={() => launchImagingOrderForm(orderTypeUuid,order)}
//                       onRemoveClick={() => removeImagingOrder(order)}
//                     />
//                   ))}
//                 </>
//               )}
//             </>
//           )}
//         </>
//       )}
//     </Tile>
//   );
// }

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
import type { ImagingOrderBasketItem } from '../../../types';
import type { ImagingConfig } from '../../../config-schema';
import { ImagingOrderBasketItemTile } from './imaging-order-basket-item-tile.component';
import { createPrepImagingOrderPostData, prepImagingOrderPostData } from '../api';
import ImagingIcon from './imaging-icon.component';
import styles from './imaging-order-basket-panel.scss';

/**
 * The extension is slotted into order-basket-slot in the main Order Basket workspace by default.
 * It renders the "Add +" button for imaging orders, and lists pending imaging orders in the order basket.
 *
 * Designs: https://app.zeplin.io/project/60d59321e8100b0324762e05/screen/648c44d9d4052c613e7f23da
 */
export function ImagingOrderBasketPanelExtension({ patient }: OrderBasketExtensionProps) {
  const { orders } = useConfig<ImagingConfig>();
  const { t } = useTranslation();

  const launchImagingOrderForm = useCallback((orderTypeUuid: string, order?: ImagingOrderBasketItem) => {
    launchWorkspace2('add-imaging-order-workspace', { orderTypeUuid, order }, null, null);
  }, []);

  const allOrderTypes: any = [
    {
      label: t('radiologyOrders', 'Radiology orders'),
      orderTypeUuid: orders.radiologyOrderTypeUuid,
      icon: 'omrs-icon-lab-order',
    },
  ];

  return (
    <>
      {allOrderTypes.map((orderTypeConfig) => (
        <ImagingOrderBasketPanel
          key={orderTypeConfig.orderTypeUuid}
          patient={patient}
          {...orderTypeConfig}
          launchImagingOrderForm={launchImagingOrderForm}
        />
      ))}
    </>
  );
}

type OrderTypeConfig = any;

interface ImagingOrderBasketPanelProps extends OrderTypeConfig {
  patient: fhir.Patient;
  launchImagingOrderForm(orderTypeUuid: string, order?: ImagingOrderBasketItem): void;
}

function ImagingOrderBasketPanel({ orderTypeUuid, label, icon, patient, launchImagingOrderForm }: ImagingOrderBasketPanelProps) {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const responsiveSize = isTablet ? 'md' : 'sm';
  const isDefaultLabOrder = icon === 'omrs-icon-lab-order';
  const { orderType, isLoadingOrderType } = useOrderType(orderTypeUuid);
  const { orders: configOrders, careSettingUuid } = useConfig<ImagingConfig>();
  const { orders, setOrders } = useOrderBasket<ImagingOrderBasketItem>(
    patient,
    orderTypeUuid,
    createPrepImagingOrderPostData(configOrders.radiologyOrderTypeUuid, careSettingUuid),
  );
  const [isExpanded, setIsExpanded] = useState(orders.length > 0);
  const {
    incompleteOrderBasketItems,
    newOrderBasketItems,
    renewedOrderBasketItems,
    revisedOrderBasketItems,
    discontinuedOrderBasketItems,
  } = useMemo(() => {
    const incompleteOrderBasketItems: Array<ImagingOrderBasketItem> = [];
    const newOrderBasketItems: Array<ImagingOrderBasketItem> = [];
    const renewedOrderBasketItems: Array<ImagingOrderBasketItem> = [];
    const revisedOrderBasketItems: Array<ImagingOrderBasketItem> = [];
    const discontinuedOrderBasketItems: Array<ImagingOrderBasketItem> = [];

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
    (order: ImagingOrderBasketItem) => {
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
            <ImagingIcon isTablet={isTablet} />
          ) : (
            <MaybeIcon icon={icon ? icon : 'omrs-icon-generic-order-type'} size={isTablet ? 40 : 24} />
          )}
          <h4 className={styles.heading}>{`${label ? t(label) : orderType?.display} (${orders.length})`}</h4>
        </div>
        <div className={styles.buttonContainer}>
          <Button
            className={styles.addButton}
            iconDescription="Add imaging Order"
            kind="ghost"
            onClick={() => launchImagingOrderForm(orderTypeUuid)}
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
                    <ImagingOrderBasketItemTile
                      key={order.uuid}
                      onItemClick={() => launchImagingOrderForm(orderTypeUuid, order)}
                      onRemoveClick={() => removeLabOrder(order)}
                      orderBasketItem={order}
                    />
                  ))}
                </>
              )}
              {newOrderBasketItems.length > 0 && (
                <>
                  {newOrderBasketItems.map((order) => (
                    <ImagingOrderBasketItemTile
                      key={order.uuid}
                      onItemClick={() => launchImagingOrderForm(orderTypeUuid, order)}
                      onRemoveClick={() => removeLabOrder(order)}
                      orderBasketItem={order}
                    />
                  ))}
                </>
              )}

              {renewedOrderBasketItems.length > 0 && (
                <>
                  {renewedOrderBasketItems.map((order) => (
                    <ImagingOrderBasketItemTile
                      key={order.uuid}
                      onItemClick={() => launchImagingOrderForm(orderTypeUuid, order)}
                      onRemoveClick={() => removeLabOrder(order)}
                      orderBasketItem={order}
                    />
                  ))}
                </>
              )}

              {revisedOrderBasketItems.length > 0 && (
                <>
                  {revisedOrderBasketItems.map((order) => (
                    <ImagingOrderBasketItemTile
                      key={order.uuid}
                      onItemClick={() => launchImagingOrderForm(orderTypeUuid, order)}
                      onRemoveClick={() => removeLabOrder(order)}
                      orderBasketItem={order}
                    />
                  ))}
                </>
              )}

              {discontinuedOrderBasketItems.length > 0 && (
                <>
                  {discontinuedOrderBasketItems.map((order) => (
                    <ImagingOrderBasketItemTile
                      key={order.uuid}
                      onItemClick={() => launchImagingOrderForm(orderTypeUuid, order)}
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

export default ImagingOrderBasketPanelExtension;

