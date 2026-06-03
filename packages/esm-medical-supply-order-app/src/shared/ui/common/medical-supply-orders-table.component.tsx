import React, { type ReactNode, useCallback, useMemo, useState } from 'react';
import { capitalize, lowerCase } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import {
    Button,
    DataTable,
    DataTableSkeleton,
    DatePicker,
    DatePickerInput,
    Layer,
    Search,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableExpandedRow,
    TableExpandHeader,
    TableExpandRow,
    TableHead,
    TableHeader,
    TableRow,
    TableToolbarContent,
    Tile,
    OverflowMenu,
    OverflowMenuItem,
} from '@carbon/react';
import {
    formatDate,
    useLayoutType,
    usePagination,
    useConfig,
    launchWorkspace2,
    showModal,
    AddIcon,
} from '@openmrs/esm-framework';
import { CardHeader, EmptyState, ErrorState, PatientChartPagination, useOrderBasket } from '@openmrs/esm-patient-common-lib';
import { usePatientMedicalSupplyOrders } from '../../../hooks/usePatientMedicalSupplyOrders';
import { type MedicalSupplyOrderBasketItem } from '../../../types';
import { OrderDetail } from './order-detail.component';
import { createPrepMedicalSupplyPostData } from '../../../form/add-medical-supply-order/api';
import styles from './medical-supply-orders-table.scss';
import type { MedicalSupplyConfig } from '../../../config-schema';

interface MedicalSupplyOrdersTableProps {
    patientUuid: string;
    showAddButton?: boolean;
    title?: string;
}

interface DataTableRow {
    id: string;
    cells: Array<{
        id: number;
        info: { header: string };
        value: ReactNode;
    }>;
    isExpanded: boolean;
}

const MedicalSupplyOrdersTable: React.FC<MedicalSupplyOrdersTableProps> = ({
    patientUuid,
    showAddButton,
    title,
}) => {
    const { t } = useTranslation();
    const defaultPageSize = 10;
    const headerTitle = t('medicalSupplyOrders', 'Medical Supply Orders');
    const isTablet = useLayoutType() === 'tablet';
    const responsiveSize = isTablet ? 'lg' : 'md';
    const [selectedFromDate, setSelectedFromDate] = useState<string>(null);
    const [selectedToDate, setSelectedToDate] = useState<string>(null);

    const patient = { uuid: patientUuid, id: patientUuid };

    const { orders: configOrders, careSettingUuid } = useConfig<MedicalSupplyConfig>();
    const orderTypeUuid = configOrders.medicalSupplyOrderTypeUuid;

    const { orders, setOrders } = useOrderBasket<MedicalSupplyOrderBasketItem>(
        patient as any,
        orderTypeUuid,
        createPrepMedicalSupplyPostData(configOrders.medicalSupplyOrderTypeUuid, careSettingUuid),
    );

    const {
        data: patientOrders,
        error,
        isLoading,
    } = usePatientMedicalSupplyOrders(patientUuid, 'ACTIVE', selectedFromDate, selectedToDate);

    const tableHeaders = [
        {
            key: 'orderNumber',
            header: t('orderNumber', 'Order number'),
            isSortable: true,
        },
        {
            key: 'dateOfOrder',
            header: t('dateOfOrder', 'Date of order'),
            isSortable: true,
        },
        {
            key: 'order',
            header: t('order', 'Order'),
            isSortable: true,
        },
        {
            key: 'priority',
            header: t('priority', 'Priority'),
            isSortable: true,
        },
        {
            key: 'orderedBy',
            header: t('orderedBy', 'Ordered by'),
            isSortable: false,
        },
        {
            key: 'status',
            header: t('status', 'Status'),
            isSortable: true,
        },
        {
            key: 'actions',
            header: t('actions', 'Actions'),
            isSortable: false,
        },
    ];

    const tableRows = useMemo(
        () =>
            patientOrders?.map((order) => ({
                id: order.uuid,
                dateActivated: order.dateActivated,
                orderNumber: order.orderNumber,
                dateOfOrder: <div className={styles.singleLineText}>{formatDate(new Date(order.dateActivated))}</div>,
                order: (
                    <>
                        {order.action === 'REVISE' && <span style={{ fontWeight: 'bold' }}>{t('revise', '(REVISE)')} </span>}
                        {order.display}
                    </>
                ),
                priority: (
                    <div className={styles.priorityPill} data-priority={lowerCase(order.urgency)}>
                        {t(order.urgency, capitalize(order.urgency?.replace('_', ' ')))}
                    </div>
                ),
                orderedBy: order.orderer?.display,
                status: order.fulfillerStatus ? (
                    <div className={styles.statusPill} data-status={lowerCase(order.fulfillerStatus.replace('_', ' '))}>
                        {t(order.fulfillerStatus, capitalize(order.fulfillerStatus.replace('_', ' ')))}
                    </div>
                ) : (
                    '--'
                ),
                actions: (
                    <OrderActions
                        orderItem={order}
                        responsiveSize={responsiveSize}
                        orders={orders}
                        setOrders={setOrders}
                        orderTypeUuid={orderTypeUuid}
                        patient={patient as any}
                    />
                ),
            })) ?? [],
        [patientOrders, t, responsiveSize, orders, setOrders, orderTypeUuid, patient],
    );

    const { results: paginatedOrders, goTo, currentPage } = usePagination(tableRows, defaultPageSize);

    const handleDateFilterChange = ([startDate, endDate]) => {
        if (startDate) {
            setSelectedFromDate(startDate.toISOString());
        }
        if (endDate) {
            setSelectedToDate(endDate.toISOString());
        }
    };

    const handleAddOrderClick = useCallback(() => {
        launchWorkspace2('add-medical-supply-order', { orderTypeUuid });
    }, [orderTypeUuid]);

    return (
        <>
            <div className={styles.filterContainer}>
                <span className={styles.rangeLabel}>{t('dateRange', 'Date range')}:</span>
                <DatePicker
                    datePickerType="range"
                    dateFormat={'d/m/Y'}
                    onChange={([startDate, endDate]) => {
                        handleDateFilterChange([startDate, endDate]);
                    }}>
                    <DatePickerInput
                        id="startDatePickerInput"
                        labelText=""
                        placeholder="dd/mm/yyyy"
                    />
                    <DatePickerInput
                        id="endDatePickerInput"
                        labelText=""
                        placeholder="dd/mm/yyyy"
                    />
                </DatePicker>
            </div>

            {(() => {
                if (isLoading) {
                    return <DataTableSkeleton role="progressbar" compact={!isTablet} zebra />;
                }

                if (error) {
                    return <ErrorState error={error} headerTitle={title} />;
                }

                return (
                    <>
                        {!tableRows?.length ? (
                            <EmptyState headerTitle={headerTitle} displayText={t('medicalSupplyOrders', 'Medical Supply Orders')} />
                        ) : (
                            <div className={styles.widgetCard}>
                                <CardHeader title={title}>
                                    <div className={styles.buttons}>
                                        {showAddButton && (
                                            <Button
                                                className={styles.addButton}
                                                kind="ghost"
                                                renderIcon={AddIcon}
                                                onClick={handleAddOrderClick}>
                                                {t('add', 'Add')}
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <div>
                                    <DataTable
                                        headers={tableHeaders}
                                        rows={paginatedOrders}
                                        size={responsiveSize}
                                        useZebraStyles>
                                        {({
                                            getExpandedRowProps,
                                            getExpandHeaderProps,
                                            getHeaderProps,
                                            getRowProps,
                                            getTableContainerProps,
                                            getTableProps,
                                            headers,
                                            onInputChange,
                                            rows,
                                        }) => (
                                            <TableContainer {...getTableContainerProps}>
                                                <div className={styles.toolBarContent}>
                                                    <TableToolbarContent>
                                                        <Layer>
                                                            <Search
                                                                expanded
                                                                labelText=""
                                                                onChange={onInputChange}
                                                                placeholder={t('searchTable', 'Search table')}
                                                                size="lg"
                                                            />
                                                        </Layer>
                                                    </TableToolbarContent>
                                                </div>
                                                <Table className={styles.table} {...getTableProps()}>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableExpandHeader enableToggle {...getExpandHeaderProps()} />
                                                            {headers.map((header) => (
                                                                <TableHeader key={header.header} {...getHeaderProps({ header })}>
                                                                    {header.header}
                                                                </TableHeader>
                                                            ))}
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {rows.map((row: DataTableRow) => {
                                                            const matchingOrder = patientOrders?.find((order) => order.uuid === row.id);

                                                            return (
                                                                <React.Fragment key={row.id}>
                                                                    <TableExpandRow className={styles.row} {...getRowProps({ row })}>
                                                                        {row.cells.map((cell) => (
                                                                            <TableCell className={styles.tableCell} key={cell.id}>
                                                                                {cell.value}
                                                                            </TableCell>
                                                                        ))}
                                                                    </TableExpandRow>
                                                                    {row.isExpanded && matchingOrder && (
                                                                        <TableExpandedRow colSpan={headers.length + 1} {...getExpandedRowProps({ row })}>
                                                                            <div style={{ padding: '1rem' }}>
                                                                                <OrderDetail label={t('testOrdered', 'Item ordered')} value={capitalize(matchingOrder.display || '--')} />
                                                                                <div className={styles.detailsGrid}>
                                                                                    <OrderDetail
                                                                                        label={t('instructions', 'Instructions')}
                                                                                        value={capitalize(matchingOrder.instructions) || t('noInstructions', 'No instructions provided')}
                                                                                    />
                                                                                    <OrderDetail
                                                                                        label={t('quantity', 'Quantity')}
                                                                                        value={`${matchingOrder.quantity || '--'} ${matchingOrder.quantityUnits?.display || matchingOrder.quantityUnits || ''}`}
                                                                                    />
                                                                                    <OrderDetail
                                                                                        label={t('brandName', 'Brand name')}
                                                                                        value={matchingOrder.brandName || '--'}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </TableExpandedRow>
                                                                    )}
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </DataTable>
                                    <div className={styles.paginationContainer}>
                                        <PatientChartPagination
                                            pageNumber={currentPage}
                                            totalItems={tableRows.length}
                                            currentItems={paginatedOrders.length}
                                            pageSize={defaultPageSize}
                                            onPageNumberChange={({ page }) => goTo(page)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                );
            })()}
        </>
    );
};

function OrderActions({
    orderItem,
    responsiveSize,
    orders,
    setOrders,
    orderTypeUuid,
    patient,
}: {
    orderItem: any;
    responsiveSize: string;
    orders: Array<MedicalSupplyOrderBasketItem>;
    setOrders: (orders: Array<MedicalSupplyOrderBasketItem>) => void;
    orderTypeUuid: string;
    patient: any;
}) {
    const { t } = useTranslation();

    const handleModifyClick = useCallback(() => {
        const medicalSupplyOrder: MedicalSupplyOrderBasketItem = {
            action: 'REVISE',
            uuid: orderItem.uuid,
            previousOrder: orderItem.uuid,
            display: orderItem.display,
            orderer: orderItem.orderer?.uuid,
            urgency: orderItem.urgency as any,
            careSetting: orderItem.careSetting?.uuid,
            orderType: orderItem.orderType?.uuid,
            concept: orderItem.concept as any,
            testType: {
                label: orderItem.concept?.display,
                conceptUuid: orderItem.concept?.uuid,
            },
            instructions: orderItem.instructions ?? undefined,
            quantity: orderItem.quantity ?? undefined,
            quantityUnits: orderItem.quantityUnits ?? undefined,
            brandName: orderItem.brandName ?? undefined,
            encounterUuid: orderItem.encounter?.uuid,
            visit: undefined,
        }

        setOrders([...orders, medicalSupplyOrder]);

        launchWorkspace2('add-medical-supply-order', {
            order: medicalSupplyOrder,
            orderTypeUuid: orderTypeUuid,
            patient,
        });
    }, [orderItem, orders, setOrders, orderTypeUuid, patient]);

    const handleCancelClick = useCallback(() => {
        const dispose = showModal('reject-medical-supply-order-modal', {
            closeModal: () => dispose(),
            order: orderItem,
        });
    }, [orderItem]);

    return (
        <Layer className={styles.layer}>
            <OverflowMenu
                align="left"
                aria-label={t('actionsMenu', 'Actions menu')}
                flipped
                selectorPrimaryFocus={'#modify'}
                size={responsiveSize}>
                <OverflowMenuItem
                    className={styles.menuItem}
                    id="modify"
                    itemText={t('modifyOrder', 'Modify order')}
                    onClick={handleModifyClick}
                />
                <OverflowMenuItem
                    className={styles.menuItem}
                    hasDivider
                    id="discontinue"
                    isDelete
                    itemText={t('cancelOrder', 'Cancel order')}
                    onClick={handleCancelClick}
                />
            </OverflowMenu>
        </Layer>
    );
}

export default MedicalSupplyOrdersTable;
