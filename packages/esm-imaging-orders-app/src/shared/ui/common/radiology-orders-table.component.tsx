import React, { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { capitalize, lowerCase } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import {
    Button,
    DataTable,
    DataTableSkeleton,
    DatePicker,
    DatePickerInput,
    InlineLoading,
    Layer,
    OverflowMenu,
    OverflowMenuItem,
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
    IconButton
} from '@carbon/react';
import {
    formatDate,
    useLayoutType,
    usePagination,
    useConfig,
    showModal,
    launchWorkspace,
    ViewIcon
} from '@openmrs/esm-framework';
import { CardHeader, EmptyState, ErrorState, PatientChartPagination, useOrderBasket } from '@openmrs/esm-patient-common-lib';
import { AddIcon, PrinterIcon } from '@openmrs/esm-framework';
import { useOrdersWorkList } from '../../../hooks/useOrdersWorklist';
import { usePatientRadiologyOrders } from '../../../hooks/usePatientRadiologyOrders';
import { type Result } from '../../../imaging-tabs/work-list/work-list.resource';
import { type ImagingOrderBasketItem } from '../../../types';
import { OrderDetail } from './order-detail.component';
import { prepImagingOrderPostData } from '../../../form/imaging-orders/api';
import styles from './radiology-orders-table.scss';

interface RadiologyOrdersTableProps {
    patientUuid: string;
    showAddButton?: boolean;
    showPrintButton?: boolean;
    title?: string;
}

type RadiologyOrderDetailsProps = {
    order: Result;
    patientId: string;
};

interface DataTableRow {
    id: string;
    cells: Array<{
        id: number;
        info: { header: string };
        value: ReactNode | { props: { orderItem: Result }; content: string };
    }>;
    isExpanded: boolean;
}

const RadiologyOrdersTable: React.FC<RadiologyOrdersTableProps> = ({
    patientUuid,
    showAddButton,
    showPrintButton,
    title,
}) => {
    const { t } = useTranslation();
    const defaultPageSize = 10;
    const headerTitle = t('radiologyOrders', 'Radiology Orders');
    const isTablet = useLayoutType() === 'tablet';
    const responsiveSize = isTablet ? 'lg' : 'md';
    const contentToPrintRef = useRef(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [selectedFromDate, setSelectedFromDate] = useState<string>(null);
    const [selectedToDate, setSelectedToDate] = useState<string>(null);

    // Order basket for tracking order modifications
    const { orders, setOrders } = useOrderBasket<ImagingOrderBasketItem>('imaging', prepImagingOrderPostData);

    // Fetch ALL radiology orders for this patient (including cancelled, in-progress, etc.)
    const {
        data: patientOrders,
        error,
        isLoading,
    } = usePatientRadiologyOrders(patientUuid, 'ACTIVE', selectedFromDate, selectedToDate);

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
                        {t(order.urgency, capitalize(order.urgency.replace('_', ' ')))}
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
            })) ?? [],
        [patientOrders, t],
    );

    const { results: paginatedOrders, goTo, currentPage } = usePagination(tableRows, defaultPageSize);

    const onBeforeGetContentResolve = useRef(null);

    useEffect(() => {
        if (isPrinting && onBeforeGetContentResolve.current) {
            onBeforeGetContentResolve.current();
        }
    }, [isPrinting]);

    const handlePrint = useReactToPrint({
        content: () => contentToPrintRef.current,
        documentTitle: `Radiology Orders - ${title} `,
        onBeforeGetContent: () =>
            new Promise((resolve) => {
                if (title) {
                    onBeforeGetContentResolve.current = resolve;
                    setIsPrinting(true);
                }
            }),
        onAfterPrint: () => {
            onBeforeGetContentResolve.current = null;
            setIsPrinting(false);
        },
    });

    const handleDateFilterChange = ([startDate, endDate]) => {
        if (startDate) {
            const isoStartDate = startDate.toISOString();
            setSelectedFromDate(isoStartDate);
            if (selectedToDate && selectedToDate < startDate) {
                setSelectedToDate(isoStartDate);
            }
        }
        if (endDate) {
            const isoEndDate = endDate.toISOString();
            setSelectedToDate(isoEndDate);
            if (selectedFromDate && selectedFromDate > endDate) {
                setSelectedFromDate(isoEndDate);
            }
        }
    };

    const handleAddOrderClick = useCallback(() => {
        // Launch the imaging order workspace for creating a new order
        launchWorkspace('add-imaging-order');
    }, []);

    return (
        <>
            <div className={styles.filterContainer}>
                <span className={styles.rangeLabel}>{t('dateRange', 'Date range')}:</span>
                <DatePicker
                    datePickerType="range"
                    dateFormat={'d/m/Y'}
                    value={''}
                    onChange={([startDate, endDate]) => {
                        handleDateFilterChange([startDate, endDate]);
                    }}>
                    <DatePickerInput
                        id="startDatePickerInput"
                        data-testid="startDatePickerInput"
                        labelText=""
                        placeholder="dd/mm/yyyy"
                    />
                    <DatePickerInput
                        id="endDatePickerInput"
                        data-testid="endDatePickerInput"
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
                            <EmptyState headerTitle={headerTitle} displayText={t('radiologyOrders', 'Radiology Orders')} />
                        ) : (
                            <div className={styles.widgetCard}>
                                <CardHeader title={title}>
                                    <div className={styles.buttons}>
                                        {showPrintButton && (
                                            <Button
                                                className={styles.printButton}
                                                iconDescription={t('printOrder', 'Print order')}
                                                kind="ghost"
                                                onClick={handlePrint}
                                                renderIcon={PrinterIcon}>
                                                {t('print', 'Print')}
                                            </Button>
                                        )}
                                        {showAddButton && (
                                            <Button
                                                className={styles.addButton}
                                                kind="ghost"
                                                renderIcon={AddIcon}
                                                iconDescription={t('addRadiologyOrder', 'Add radiology order')}
                                                onClick={handleAddOrderClick}>
                                                {t('add', 'Add')}
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <div ref={contentToPrintRef}>
                                    <DataTable
                                        aria-label={t('radiologyOrderDetails', 'Radiology order details')}
                                        data-floating-menu-container
                                        headers={tableHeaders}
                                        isSortable
                                        overflowMenuOnHover={!isTablet}
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
                                            <>
                                                <TableContainer {...getTableContainerProps}>
                                                    {!isPrinting && (
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
                                                    )}
                                                    <Table className={styles.table} {...getTableProps()}>
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableExpandHeader enableToggle {...getExpandHeaderProps()} />
                                                                {headers.map((header: { header: string }) => (
                                                                    <TableHeader key={header.header} {...getHeaderProps({ header })}>
                                                                        {header.header}
                                                                    </TableHeader>
                                                                ))}
                                                                <TableExpandHeader />
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
                                                                                    {cell.value?.['content'] ?? cell.value}
                                                                                </TableCell>
                                                                            ))}
                                                                            {!isPrinting && matchingOrder && (
                                                                                <TableCell className="cds--table-column-menu">
                                                                                    <OrderActions
                                                                                        orderItem={matchingOrder}
                                                                                        responsiveSize={responsiveSize}
                                                                                        orders={orders}
                                                                                        setOrders={setOrders}
                                                                                    />
                                                                                </TableCell>
                                                                            )}
                                                                        </TableExpandRow>
                                                                        {row.isExpanded ? (
                                                                            <TableExpandedRow
                                                                                colSpan={headers.length + 2}
                                                                                {...getExpandedRowProps({
                                                                                    row,
                                                                                })}>
                                                                                {matchingOrder && <RadiologyOrderDetails patientId={patientUuid} order={matchingOrder} />}
                                                                            </TableExpandedRow>
                                                                        ) : (
                                                                            <TableExpandedRow className={styles.hiddenRow} colSpan={headers.length + 2} />
                                                                        )}
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                                {rows.length === 0 ? (
                                                    <div className={styles.tileContainer}>
                                                        <Tile className={styles.emptyStateTile}>
                                                            <div className={styles.tileContent}>
                                                                <p className={styles.content}>
                                                                    {t('noMatchingOrdersToDisplay', 'No matching orders to display')}
                                                                </p>
                                                                <p className={styles.helperText}>{t('checkFilters', 'Check the filters above')}</p>
                                                            </div>
                                                        </Tile>
                                                    </div>
                                                ) : null}
                                            </>
                                        )}
                                    </DataTable>
                                    {!isPrinting && (
                                        <div className={styles.paginationContainer}>
                                            <PatientChartPagination
                                                pageNumber={currentPage}
                                                totalItems={tableRows.length}
                                                currentItems={paginatedOrders.length}
                                                pageSize={defaultPageSize}
                                                onPageNumberChange={({ page }) => goTo(page)}
                                            />
                                        </div>
                                    )}
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
    setOrders
}: {
    orderItem: Result;
    responsiveSize: string;
    orders: Array<ImagingOrderBasketItem>;
    setOrders: (orders: Array<ImagingOrderBasketItem>) => void;
}) {
    const { t } = useTranslation();

    const handleModifyClick = useCallback(() => {
        // Convert Result to ImagingOrderBasketItem format for workspace
        const imagingOrder: ImagingOrderBasketItem = {
            action: 'REVISE', // Use REVISE to modify existing order, not create new one
            uuid: orderItem.uuid, // Include the order UUID
            previousOrder: orderItem.uuid, // Link to the order being revised
            display: orderItem.display,
            orderer: orderItem.orderer?.uuid,
            urgency: orderItem.urgency as any, // OrderUrgency type
            careSetting: orderItem.careSetting?.uuid,
            orderType: orderItem.orderType?.uuid,
            concept: orderItem.concept as any, // Full concept object
            testType: {
                label: orderItem.concept?.display,
                conceptUuid: orderItem.concept?.uuid,
            },
            instructions: orderItem.instructions,
            orderReason: orderItem.orderReason?.uuid,
            orderReasonNonCoded: orderItem.orderReasonNonCoded,
            laterality: orderItem.laterality,
            bodySite: orderItem.bodySite?.display || '',
            scheduledDate: orderItem.scheduledDate ? new Date(orderItem.scheduledDate) : undefined,
            commentToFulfiller: orderItem.commentToFulfiller,
        };

        // Add order to basket FIRST (this is the key - matching drug order pattern)
        setOrders([...orders, imagingOrder]);

        // Then launch the imaging order workspace for editing
        launchWorkspace('add-imaging-order', {
            order: imagingOrder,
        });
    }, [orderItem, orders, setOrders]);

    const handleCancelClick = useCallback(() => {
        // Show the reject order modal
        const dispose = showModal('reject-imaging-order-modal', {
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

function RadiologyOrderDetails({ order, patientId }: RadiologyOrderDetailsProps) {
    const { t } = useTranslation();

    return (
        <div style={{ padding: '1rem' }}>
            <OrderDetail label={t('testOrdered', 'Test ordered')} value={capitalize(order.display || '--')} />
            <div className={styles.detailsGrid}>
                <OrderDetail
                    label={t('instructions', 'Instructions')}
                    value={capitalize(order.instructions) || t('noInstructions', 'No instructions provided')}
                />
                <OrderDetail
                    label={t('orderReason', 'Order reason')}
                    value={capitalize(order.orderReasonNonCoded || '--')}
                />
                <OrderDetail label={t('laterality', 'Laterality')} value={capitalize(order.laterality || '--')} />
                <OrderDetail label={t('bodySite', 'Body site')} value={order.bodySite ? capitalize(order.bodySite.display || '--') : '--'} />
                <OrderDetail
                    label={t('scheduledDate', 'Scheduled date')}
                    value={order.scheduledDate ? formatDate(new Date(order.scheduledDate)) : '--'}
                />
                <OrderDetail
                    label={t('fulfillerComment', 'Fulfiller comment')}
                    value={capitalize(order.fulfillerComment || '--')}
                />
            </div>
            <IconButton
                label="View Image"
                align="right"
                onClick={() => {
                    window.open(`weasis://$dicom:rs --url "http://34.66.106.64:8080/dcm4chee-arc/aets/DCM4CHEE/rs" -r"patientID=${patientId}" --query-ext "&includedefaults=false`)
                    }
                }
            >
                <ViewIcon icon-color="white" />
            </IconButton>
        </div>
    );
}

export default RadiologyOrdersTable;
