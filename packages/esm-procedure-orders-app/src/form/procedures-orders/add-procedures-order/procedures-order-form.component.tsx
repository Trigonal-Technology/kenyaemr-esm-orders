import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import { useOrderBasket } from '@openmrs/esm-patient-common-lib';
import {
  translateFrom,
  useLayoutType,
  useSession,
  useConfig,
  ExtensionSlot,
} from '@openmrs/esm-framework';
import { postOrder, showOrderSuccessToast } from '@openmrs/esm-patient-common-lib';
import { usePatientProcedureOrders } from '../../../hooks/usePatientProcedureOrders';
import { prepProceduresOrderPostData } from '../api';
import {
  Button,
  ButtonSet,
  Column,
  ComboBox,
  DatePicker,
  DatePickerInput,
  Form,
  Layer,
  Grid,
  InlineNotification,
  TextArea,
  NumberInput,
} from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { priorityOptions } from './procedures-order';
import { useProceduresTypes } from './useProceduresTypes';
import { Controller, type FieldErrors, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type ConfigObject } from '../../../config-schema';
import styles from './procedures-order-form.scss';
import type { ProcedureOrderBasketItem } from '../../../types';
import { moduleName } from '../../../constants';
import { Workspace2DefinitionProps } from '@openmrs/esm-framework';

export interface ProceduresOrderFormProps {
  closeWorkspace: Workspace2DefinitionProps['closeWorkspace'];
  initialOrder: ProcedureOrderBasketItem;

  /**
   * This field should only be supplied for an existing order saved to the backend
   */
  orderToEditOrdererUuid?: string;
  orderTypeUuid: string;
  setHasUnsavedChanges: (hasUnsavedChanges: boolean) => void;
  patient: fhir.Patient;
  visit: any;
}

export function ProceduresOrderForm({
  initialOrder,
  orderToEditOrdererUuid,
  closeWorkspace,
  orderTypeUuid,
  setHasUnsavedChanges,
  patient,
  visit,
}: ProceduresOrderFormProps) {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const session = useSession();
  const config = useConfig<ConfigObject>();
  const { orders, setOrders } = useOrderBasket<ProcedureOrderBasketItem>(patient, orderTypeUuid, (order, patientUuid, encounterUuid) =>
    prepProceduresOrderPostData(order, patientUuid, encounterUuid, config),
  );
  const { mutate: mutateOrders } = usePatientProcedureOrders(patient?.id);
  const { testTypes, isLoading: isLoadingTestTypes, error: errorLoadingTestTypes } = useProceduresTypes();
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [showScheduleDate, setShowScheduleDate] = useState(
    initialOrder?.urgency === 'ON_SCHEDULED_DATE'
  );

  const proceduresOrderFormSchema = z.object({
    instructions: z.string().optional(),
    urgency: z.string().refine((value) => value !== '', {
      message: translateFrom(moduleName, 'addLabOrderPriorityRequired', 'Priority is required'),
    }),
    testType: z.object(
      { label: z.string(), conceptUuid: z.string() },
      {
        required_error: translateFrom(moduleName, 'addLabOrderLabTestTypeRequired', 'Test type is required'),
        invalid_type_error: translateFrom(moduleName, 'addLabOrderLabReferenceRequired', 'Test type is required'),
      },
    ),
    scheduleDate: z.union([z.string(), z.date(), z.string().optional()]),
    numberOfRepeats: z.union([z.number(), z.string()]).optional(),
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProcedureOrderBasketItem>({
    mode: 'all',
    resolver: zodResolver(proceduresOrderFormSchema),
    defaultValues: {
      urgency: 'ROUTINE',
      numberOfRepeats: '1',
      scheduleDate: initialOrder?.scheduledDate || initialOrder?.scheduleDate,
      ...initialOrder,
    },
  });

  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty, setHasUnsavedChanges]);

  const handleFormSubmission = useCallback(
    (data: ProcedureOrderBasketItem) => {
      data.action = initialOrder?.action || 'NEW';
      data.previousOrder = initialOrder?.previousOrder;
      data.careSetting = config.careSettingUuid;
      data.orderer = session.currentProvider.uuid;
      data.patient = patient;
      data.display = data.testType.label;
      const newOrders = [...orders];
      const existingOrderIndex = orders.findIndex((order) => {
        const orderConceptUuid = order?.testType?.conceptUuid;
        const initialConceptUuid = initialOrder?.testType?.conceptUuid;
        return orderConceptUuid === initialConceptUuid || orderConceptUuid === data?.testType?.conceptUuid;
      });

      if (existingOrderIndex > -1) {
        newOrders[existingOrderIndex] = data;
      } else {
        newOrders.push(data);
      }

      setHasUnsavedChanges(false);
      setOrders(newOrders);
      closeWorkspace({ discardUnsavedChanges: true });
    },
    [orders, setOrders, closeWorkspace, session?.currentProvider?.uuid, initialOrder, config.careSettingUuid, patient, setHasUnsavedChanges],
  );

  const submitProcedureOrderToServer = useCallback(
    async (data: ProcedureOrderBasketItem) => {
      const finalizedOrder: any = {
        ...initialOrder,
        ...data,
        action: 'REVISE',
        orderer: session.currentProvider.uuid,
        patient: patient,
      };

      const encounterUuid = finalizedOrder.encounterUuid || visit?.uuid || visit?.encounter?.uuid;

      if (finalizedOrder) {
        const postData = prepProceduresOrderPostData(
          finalizedOrder,
          patient.id,
          encounterUuid,
          config,
        );

        try {
          const response = await postOrder(postData);
          if (response) {
            setOrders(orders.filter((order) => order.testType.conceptUuid !== initialOrder.testType.conceptUuid));
            mutateOrders();
            showOrderSuccessToast(moduleName, [finalizedOrder]);
            setHasUnsavedChanges(false);
            closeWorkspace({ discardUnsavedChanges: true });
          }
        } catch (error) {
          setShowErrorNotification(true);
        }
      }
    },
    [
      initialOrder,
      session.currentProvider.uuid,
      patient,
      visit,
      config,
      orders,
      setOrders,
      mutateOrders,
      setHasUnsavedChanges,
      closeWorkspace,
    ],
  );

  const cancelOrder = useCallback(() => {
    const testTypeUuid = initialOrder?.testType?.conceptUuid || '';
    setOrders(orders.filter((order) => order.testType.conceptUuid !== testTypeUuid));
    setHasUnsavedChanges(false);
    closeWorkspace();
  }, [closeWorkspace, orders, setOrders, initialOrder, setHasUnsavedChanges]);

  const onError = (errors: FieldErrors<ProcedureOrderBasketItem>) => {
    if (errors) {
      setShowErrorNotification(true);
    }
  };

  return (
    <>
      {errorLoadingTestTypes && (
        <InlineNotification
          kind="error"
          lowContrast
          className={styles.inlineNotification}
          title={t('errorLoadingTestTypes', 'Error occurred when loading test types')}
          subtitle={t('tryReopeningTheForm', 'Please try launching the form again')}
        />
      )}
      <Form className={styles.orderForm} onSubmit={handleSubmit(initialOrder?.action === 'REVISE' ? submitProcedureOrderToServer : handleFormSubmission, onError)} id="procedureOrderForm">
        <div className={styles.form}>
          <ExtensionSlot name="top-of-procedure-order-form-slot" state={{ order: initialOrder }} />
          <Grid className={styles.gridRow}>
            <Column lg={16} md={8} sm={4}>
              <InputWrapper>
                <Controller
                  name="testType"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <ComboBox
                      size="lg"
                      id="testTypeInput"
                      titleText={t('testType', 'Procedure / Test type')}
                      selectedItem={value}
                      items={testTypes ?? []}
                      placeholder={
                        isLoadingTestTypes ? `${t('loading', 'Loading')}...` : t('testTypePlaceholder', 'Select one')
                      }
                      onBlur={onBlur}
                      disabled={isLoadingTestTypes}
                      onChange={({ selectedItem }) => onChange(selectedItem)}
                      invalid={errors.testType?.message}
                      invalidText={errors.testType?.message}
                    />
                  )}
                />
              </InputWrapper>
            </Column>
          </Grid>
          <Grid className={styles.gridRow}>
            <Column lg={8} md={8} sm={4}>
              <InputWrapper>
                <Controller
                  name="urgency"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <ComboBox
                      size="lg"
                      id="priorityInput"
                      titleText={t('priority', 'Priority')}
                      selectedItem={priorityOptions.find((option) => option.value === value) || null}
                      items={priorityOptions ?? []}
                      onBlur={onBlur}
                      onChange={({ selectedItem }) => {
                        onChange(selectedItem?.value || '');
                        setShowScheduleDate(selectedItem?.label === 'Scheduled');
                      }}
                      invalid={errors.urgency?.message}
                      invalidText={errors.urgency?.message}
                    />
                  )}
                />
              </InputWrapper>
            </Column>
          </Grid>
          {showScheduleDate && (
            <Grid className={styles.gridRow}>
              <Column lg={16} md={4} sm={4}>
                <div className={styles.fullWidthDatePickerContainer}>
                  <InputWrapper>
                    <Controller
                      name="scheduleDate"
                      control={control}
                      render={({ field: { onBlur, value, onChange, ref } }) => (
                        <DatePicker
                          datePickerType="single"
                          value={value}
                          onChange={([newStartDate]) => onChange(newStartDate)}
                          onBlur={onBlur}
                          ref={ref}>
                          <DatePickerInput
                            id="scheduleDatePicker"
                            placeholder="mm/dd/yyyy"
                            labelText={t('scheduleDate', 'Scheduled date')}
                            size="lg"
                          />
                        </DatePicker>
                      )}
                    />
                  </InputWrapper>
                </div>
              </Column>
            </Grid>
          )}
          <Grid className={styles.gridRow}>
            <Column lg={16} md={8} sm={4}>
              <InputWrapper>
                <Controller
                  name="numberOfRepeats"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <NumberInput
                      enableCounter
                      id="numberOfRepeats"
                      label={t('numberOfRepeats', 'Quantity / Number of repeats')}
                      min={1}
                      hideSteppers={false}
                      value={value}
                      onChange={(event, { value }) => onChange(value)}
                      onBlur={onBlur}
                      invalid={errors.numberOfRepeats?.message}
                      invalidText={errors.numberOfRepeats?.message}
                    />
                  )}
                />
              </InputWrapper>
            </Column>
          </Grid>
          <Grid className={styles.gridRow}>
            <Column lg={16} md={8} sm={4}>
              <InputWrapper>
                <Controller
                  name="instructions"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextArea
                      enableCounter
                      id="additionalInstructionsInput"
                      size="lg"
                      labelText={t('additionalInstructions', 'Additional instructions')}
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      maxCount={500}
                      invalid={errors.instructions?.message}
                      invalidText={errors.instructions?.message}
                    />
                  )}
                />
              </InputWrapper>
            </Column>
          </Grid>
        </div>
        <div>
          {showErrorNotification && (
            <Column className={styles.errorContainer}>
              <InlineNotification
                lowContrast
                title={t('error', 'Error')}
                subtitle={t('pleaseRequiredFields', 'Please fill all required fields') + '.'}
                onClose={() => setShowErrorNotification(false)}
              />
            </Column>
          )}
          <ButtonSet
            className={classNames(styles.buttonSet, isTablet ? styles.tabletButtonSet : styles.desktopButtonSet)}>
            <Button className={styles.button} kind="secondary" onClick={cancelOrder} size="xl">
              {t('discard', 'Discard')}
            </Button>
            <Button className={styles.button} kind="primary" type="submit" size="xl">
              {t('saveOrder', 'Save order')}
            </Button>
          </ButtonSet>
        </div>
      </Form>
    </>
  );
}

function InputWrapper({ children }) {
  const isTablet = useLayoutType() === 'tablet';
  return (
    <Layer level={isTablet ? 1 : 0}>
      <div className={styles.field}>{children}</div>
    </Layer>
  );
}
