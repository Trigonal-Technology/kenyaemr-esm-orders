import React from 'react';
import { TabPanels, TabList, Tabs, Tab, TabPanel } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useOrdersWorkList } from '../hooks/useOrdersWorklist';

import { TestsOrdered } from './test-ordered/tests-ordered.component';
import WorkList from './work-list/work-list.component';
import { ReferredTests } from './referred-test/referred-ordered.component';
import { OrdersNotDone } from './orders-not-done/orders-not-done.component';
import { useImagingOrderStats } from '../shared/imaging.resource';

import styles from './imaging-tabs.scss';
import ImagingOrderSearch from './search/imaging-order-search.component';

export const ImagingTabs: React.FC = () => {
  const { t } = useTranslation();
  const params = useParams<{ patientUuid: string }>();

  const { activeOrdersCount, workListCount, referredTestsCount, ordersNotDoneCount, completedCount } = useOrderCounts();

  const searchTab = [
    {
      label: 'search',
      text: t('search', 'Search'),
      count: 0,
      component: <ImagingOrderSearch />,
    },
  ];

  const tabsData = [
    ...(params.patientUuid ? searchTab : []),
    {
      label: 'pendingOrders',
      text: t('activeOrders', 'Active Orders'),
      count: activeOrdersCount,
      component: <TestsOrdered />,
    },
    {
      label: 'workList',
      text: t('workList', 'WorkList'),
      count: workListCount,
      component: <WorkList fulfillerStatus="IN_PROGRESS" />,
    },
    {
      label: 'referredProcedures',
      text: t('referredOut', 'Referred Out'),
      count: referredTestsCount,
      component: <ReferredTests />,
    },
    {
      label: 'completed',
      text: t('completed', 'Completed'),
      count: completedCount,
      component: <WorkList fulfillerStatus="COMPLETED" />,
    },
    {
      label: 'declined',
      text: t('declined', 'Declined'),
      count: ordersNotDoneCount,
      component: <OrdersNotDone fulfillerStatus="DECLINED" />,
    },
  ];

  return (
    <div className={styles.imagingTabsContainer}>
      <Tabs>
        <TabList aria-label="List of tabs" contained style={{ marginLeft: '1rem' }}>
          {tabsData.map(({ label, text, count }) => (
            <Tab key={label}>
              {t(label, text)} {count > 0 ? `(${count})` : ''}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          {tabsData.map(({ label, component }) => (
            <TabPanel key={label}>{component}</TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </div>
  );
};

const useOrderCounts = () => {
  const { count: activeOrdersCount } = useImagingOrderStats('');
  const { count: workListCount } = useImagingOrderStats('IN_PROGRESS');
  const { count: referredTestsCount } = useImagingOrderStats('EXCEPTION');
  const { count: ordersNotDoneCount } = useImagingOrderStats('DECLINED');
  const { count: completedCount } = useImagingOrderStats('COMPLETED');

  return { activeOrdersCount, workListCount, referredTestsCount, ordersNotDoneCount, completedCount };
};


