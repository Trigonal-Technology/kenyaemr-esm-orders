import React, { useCallback, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Button, ButtonSkeleton, Search, SkeletonText, Tile } from '@carbon/react';
import { ArrowRight, ShoppingCartArrowDown, ShoppingCartArrowUp } from '@carbon/react/icons';
import { useDebounce, useLayoutType, useSession, ResponsiveWrapper, closeWorkspace, launchWorkspace, useConfig } from '@openmrs/esm-framework';
import { useOrderBasket } from '@openmrs/esm-patient-common-lib';
import { createPrepBedOrderPostData } from '../api';
import { type BedOrderType } from '../../../hooks/useBedTypes';
import { type UseBedOrderType } from '../../../hooks/useBedTypes';
import { createEmptyBedOrder } from './bed-order';
import { type BedOrderBasketItem } from '../../../types';
import type { Workspace2DefinitionProps, Visit } from '@openmrs/esm-framework';
import type { BedOrderConfig } from '../../../config-schema';
import { useBedSearch } from './bed-order.resource';
import styles from './bed-type-search.scss';

export interface BedTypeSearchProps {
  openLabForm: (searchResult: BedOrderBasketItem) => void;
  orderTypeUuid: string;
  closeWorkspace: Workspace2DefinitionProps['closeWorkspace'];
  patient: any;
  visit: Visit;
}

export function BedTypeSearch({ openLabForm, patient, orderTypeUuid, closeWorkspace }: BedTypeSearchProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm);
  const searchInputRef = useRef(null);

  const focusAndClearSearchInput = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleSearchTermChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value ?? '');
  };

  return (
    <>
      <ResponsiveWrapper>
        <Search
          autoFocus
          size="lg"
          placeholder={t('searchFieldPlaceholder', 'Search for a bed type')}
          labelText={t('searchFieldPlaceholder', 'Search for a bed type')}
          onChange={handleSearchTermChange}
          ref={searchInputRef}
          value={searchTerm}
        />
      </ResponsiveWrapper>
      <BedTypeSearchResults
        searchTerm={debouncedSearchTerm}
        openOrderForm={openLabForm}
        focusAndClearSearchInput={focusAndClearSearchInput}
        patient={patient}
        orderTypeUuid={orderTypeUuid}
        closeWorkspace={closeWorkspace}
      />
    </>
  );
}

interface BedTypeSearchResultsProps {
  searchTerm: string;
  openOrderForm: (searchResult: BedOrderBasketItem) => void;
  focusAndClearSearchInput: () => void;
  patient: any;
  orderTypeUuid: string;
  closeWorkspace: Workspace2DefinitionProps['closeWorkspace'];
}

function BedTypeSearchResults({
  searchTerm,
  openOrderForm,
  focusAndClearSearchInput,
  patient,
  orderTypeUuid,
  closeWorkspace,
}: BedTypeSearchResultsProps) {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const { bedTypes, isLoading, error } = useBedSearch(searchTerm, orderTypeUuid);

  if (isLoading) {
    return <BedTypeSearchSkeleton />;
  }

  if (error) {
    return (
      <Tile className={styles.emptyState}>
        <div>
          <h4 className={styles.productiveHeading01}>
            {t('errorFetchingBedTypes', 'Error fetching results for "{{searchTerm}}"', {
              searchTerm,
            })}
          </h4>
          <p className={styles.bodyShort01}>
            <span>{t('trySearchingAgain', 'Please try searching again')}</span>
          </p>
        </div>
      </Tile>
    );
  }

  return (
    <>
      {bedTypes?.length ? (
        <div className={styles.container}>
          {searchTerm && (
            <div className={styles.orderBasketSearchResultsHeader}>
              <span className={styles.searchResultsCount}>
                {t('searchResultsMatchesForTerm', '{{count}} results for "{{searchTerm}}"', {
                  count: bedTypes?.length,
                  searchTerm,
                })}
              </span>
              <Button kind="ghost" onClick={focusAndClearSearchInput} size={isTablet ? 'md' : 'sm'}>
                {t('clearSearchResults', 'Clear Results')}
              </Button>
            </div>
          )}
          <div className={styles.resultsContainer}>
            {bedTypes.map((bedType) => (
              <BedTypeSearchResultItem
                key={bedType.conceptUuid}
                bedType={bedType}
                openOrderForm={openOrderForm}
                patient={patient}
                orderTypeUuid={orderTypeUuid}
                closeWorkspace={closeWorkspace}
              />
            ))}
          </div>
        </div>
      ) : (
        <Tile className={styles.emptyState}>
          <div>
            <h4 className={styles.productiveHeading01}>
              {t('noResultsForBedTypeSearch', 'No results to display for "{{searchTerm}}"', {
                searchTerm,
              })}
            </h4>
            <p className={styles.bodyShort01}>
              <span>{t('tryTo', 'Try to')}</span>{' '}
              <span className={styles.link} role="link" tabIndex={0} onClick={focusAndClearSearchInput}>
                {t('searchAgain', 'search again')}
              </span>{' '}
              <span>{t('usingADifferentTerm', 'using a different term')}</span>
            </p>
          </div>
        </Tile>
      )}
      <hr className={classNames(styles.divider, isTablet ? styles.tabletDivider : styles.desktopDivider)} />
    </>
  );
}

interface BedTypeSearchResultItemProps {
  bedType: BedOrderType;
  openOrderForm: (searchResult: BedOrderBasketItem) => void;
  patient: any;
  orderTypeUuid: string;
  closeWorkspace: Workspace2DefinitionProps['closeWorkspace'];
}

const BedTypeSearchResultItem: React.FC<BedTypeSearchResultItemProps> = ({
  bedType,
  openOrderForm,
  patient,
  orderTypeUuid,
  closeWorkspace,
}) => {
  const isTablet = useLayoutType() === 'tablet';
  const session = useSession();
  const { orders: configOrders, careSettingUuid } = useConfig<BedOrderConfig>();
  const { orders, setOrders } = useOrderBasket<BedOrderBasketItem>(
    patient,
    orderTypeUuid,
    createPrepBedOrderPostData(configOrders.bedOrderTypeUuid, careSettingUuid),
  );
  const bedTypeAlreadyInBasket = useMemo(
    () => orders?.some((order) => order.testType.conceptUuid === bedType.conceptUuid),
    [orders, bedType],
  );

  const createBedOrder = useCallback(
    (bedType: BedOrderType) => {
      return createEmptyBedOrder(bedType, session.currentProvider.uuid);
    },
    [session.currentProvider?.uuid],
  );

  const { t } = useTranslation();

  const addToBasket = useCallback(() => {
    const bedOrder = createBedOrder(bedType);
    bedOrder.isOrderIncomplete = true;
    setOrders([...orders, bedOrder]);
    closeWorkspace();
  }, [orders, setOrders, createBedOrder, bedType, closeWorkspace]);

  const removeFromBasket = useCallback(() => {
    setOrders(orders.filter((order) => order.testType.conceptUuid !== bedType.conceptUuid));
  }, [orders, setOrders, bedType.conceptUuid]);

  return (
    <Tile
      className={classNames(styles.searchResultTile, {
        [styles.tabletSearchResultTile]: isTablet,
      })}
      key={bedType.conceptUuid}
      role="listitem">
      <div className={classNames(styles.searchResultTileContent, styles.text02)}>
        <p>
          <span className={styles.productiveHeading01}>{bedType.label}</span>{' '}
        </p>
      </div>
      <div className={styles.searchResultActions}>
        {bedTypeAlreadyInBasket ? (
          <Button
            kind="danger--ghost"
            renderIcon={(props) => <ShoppingCartArrowUp size={16} {...props} />}
            onClick={() => removeFromBasket()}>
            {t('removeFromBasket', 'Remove from basket')}
          </Button>
        ) : (
          <Button
            kind="ghost"
            renderIcon={(props) => <ShoppingCartArrowDown size={16} {...props} />}
            onClick={() => addToBasket()}>
            {t('directlyAddToBasket', 'Add to basket')}
          </Button>
        )}
        <Button
          kind="ghost"
          renderIcon={(props) => <ArrowRight size={16} {...props} />}
          onClick={() => openOrderForm(createBedOrder(bedType))}>
          {t('goToBedOrderForm', 'Order form')}
        </Button>
      </div>
    </Tile>
  );
};

const BedTypeSearchSkeleton = () => {
  const isTablet = useLayoutType() === 'tablet';
  const tileClassName = `${isTablet ? `${styles.tabletSearchResultTile}` : `${styles.desktopSearchResultTile}`} ${styles.skeletonTile
    }`;
  return (
    <div className={styles.searchResultSkeletonWrapper}>
      <div className={styles.orderBasketSearchResultsHeader}>
        <SkeletonText className={styles.searchResultCntSkeleton} />
        <ButtonSkeleton size={isTablet ? 'md' : 'sm'} />
      </div>
      <Tile className={tileClassName}>
        <SkeletonText />
      </Tile>
      <Tile className={tileClassName}>
        <SkeletonText />
      </Tile>
      <Tile className={tileClassName}>
        <SkeletonText />
      </Tile>
      <Tile className={tileClassName}>
        <SkeletonText />
      </Tile>
      <hr className={classNames(styles.divider, isTablet ? styles.tabletDivider : styles.desktopDivider)} />
    </div>
  );
};
