import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import {
  useOrderBasket,
  postOrder,
  useMutatePatientOrders,
  showOrderSuccessToast,
} from '@openmrs/esm-patient-common-lib';
import {
  translateFrom,
  useLayoutType,
  useSession,
  type DefaultWorkspaceProps,
  ExtensionSlot,
  launchWorkspace,
  showSnackbar,
} from '@openmrs/esm-framework';
import { createPrepImagingOrderPostData, prepImagingOrderPostData, useConceptById } from '../api';
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
} from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { priorityOptions } from './imaging-order';
import { useImagingTypes } from './useImagingTypes';
import { Controller, type FieldErrors, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { moduleName, BODY_SITE, MODALITY } from '../../../constants';
import styles from './imaging-order-form.scss';
import type { ImagingOrderBasketItem } from '../../../types';
import type { Workspace2DefinitionProps } from '@openmrs/esm-framework';
import { useConfig } from '@openmrs/esm-framework';
import { ImagingConfig } from '../../../config-schema';

// export interface ImagingOrderFormProps {
//   initialOrder: ImagingOrderBasketItem;
//   closeWorkspace: (options?: any) => void;
//   closeWorkspaceWithSavedChanges: (options?: any) => void;
//   promptBeforeClosing: (cb: () => boolean) => void;
//   patient: any;
// }

export interface ImagingOrderFormProps {
  closeWorkspace: Workspace2DefinitionProps['closeWorkspace'];
  initialOrder: ImagingOrderBasketItem;

  /**
   * This field should only be supplied for an existing order saved to the backend
   */
  orderToEditOrdererUuid?: string;
  orderTypeUuid: string;
  setHasUnsavedChanges: (hasUnsavedChanges: boolean) => void;
  patient: fhir.Patient;
  visit: any;
}

// Designs:
//   https://app.zeplin.io/project/60d5947dd636aebbd63dce4c/screen/640b06c440ee3f7af8747620
//   https://app.zeplin.io/project/60d5947dd636aebbd63dce4c/screen/640b06d286e0aa7b0316db4a
export function ImagingOrderForm({
  initialOrder,
  orderToEditOrdererUuid,
  closeWorkspace,
  orderTypeUuid,
  setHasUnsavedChanges,
  patient,
  visit,
}: ImagingOrderFormProps) {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const session = useSession();
  const { testTypes, isLoading: isLoadingTestTypes, error: errorLoadingTestTypes } = useImagingTypes();
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const { orders: configOrders, careSettingUuid } = useConfig<ImagingConfig>();
  const { mutate: mutateOrders } = useMutatePatientOrders(patient.id || (patient as any).uuid);

  const { orders, setOrders, clearOrders } = useOrderBasket<ImagingOrderBasketItem>(
    patient,
    orderTypeUuid,
    createPrepImagingOrderPostData(configOrders.radiologyOrderTypeUuid, careSettingUuid),
  );

  const lateralityItems = [
    { value: 'LEFT', label: 'Left' },
    { value: 'RIGHT', label: 'Right' },
    { value: 'BILATERAL', label: 'Bilateral' },
  ];

  const {
    items: { answers: bodySiteItems = [] },
  } = useConceptById(BODY_SITE);

  // const {
  //   items: { setMembers: modalityItems = [] },
  // } = useConceptById(MODALITY);


  const imagingOrderFormSchema = z.object({
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
    // commentToFulfiller: z.string().optional(),
    laterality: z.string().optional(),
    bodySite: z.string().optional(),
    // modality: z.string().optional(),
  });

  const {
    control,
    handleSubmit,
    formState: { errors, defaultValues, isDirty },
  } = useForm<ImagingOrderBasketItem>({
    mode: 'all',
    resolver: zodResolver(imagingOrderFormSchema),
    defaultValues: {
      ...initialOrder,
    },
  });

  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty, setHasUnsavedChanges]);

  const handleFormSubmission = useCallback(
    (data: ImagingOrderBasketItem) => {
      const providerUuid = session?.currentProvider?.uuid;
      const patientId = (patient as any)?.uuid || (patient as any)?.id;

      if (!patientId || !providerUuid) {
        console.error('Missing patient ID or provider UUID', { patientId, providerUuid });
        return;
      }

      // Preserve the action from initialOrder (REVISE, RENEW, etc.) instead of hardcoding to NEW
      const updatedOrder: any = {
        ...data,
        display: data.testType.label,
        action: initialOrder?.action || 'NEW',
        careSetting: initialOrder?.careSetting || careSettingUuid,
        orderer: providerUuid,
        patient: patientId,
      };

      // Preserve previousOrder and uuid for REVISE/RENEW orders (required by API)
      if (initialOrder?.previousOrder) {
        updatedOrder.previousOrder = initialOrder.previousOrder;
      }
      if (initialOrder?.uuid) {
        updatedOrder.uuid = initialOrder.uuid;
      }

      const newOrders = [...orders];

      // Try to find if this exact test is already in the basket to replace it
      const existingOrderIndex = orders.findIndex((order) => {
        const orderConceptUuid = order?.testType?.conceptUuid;
        const initialConceptUuid = initialOrder?.testType?.conceptUuid;
        return orderConceptUuid === initialConceptUuid || orderConceptUuid === data?.testType?.conceptUuid;
      });

      if (existingOrderIndex > -1) {
        newOrders[existingOrderIndex] = updatedOrder;
      } else {
        newOrders.push(updatedOrder);
      }

      setHasUnsavedChanges(false);
      setOrders(newOrders);
      closeWorkspace({ discardUnsavedChanges: true });
    },
    [orders, setOrders, session, initialOrder, closeWorkspace, patient, setHasUnsavedChanges, careSettingUuid],
  );

  const submitImagingOrderToServer = useCallback(
    (data: ImagingOrderBasketItem) => {
      const providerUuid = session?.currentProvider?.uuid;
      const patientId = (patient as any)?.uuid || (patient as any)?.id;

      const finalizedOrder: ImagingOrderBasketItem = {
        ...initialOrder,
        ...data,
        display: data.testType.label,
        orderer: providerUuid,
      };

      const postData = prepImagingOrderPostData(
        finalizedOrder,
        patientId,
        finalizedOrder?.encounterUuid || (visit as any)?.uuid,
        configOrders.radiologyOrderTypeUuid,
        careSettingUuid,
      );

      return postOrder(postData)
        .then(() => {
          clearOrders();
          mutateOrders();
          showOrderSuccessToast(moduleName, [finalizedOrder]);
          closeWorkspace({ discardUnsavedChanges: true });
        })
        .catch((error) => {
          showSnackbar({
            isLowContrast: false,
            kind: 'error',
            title: t('errorSavingImagingOrder', 'Error saving imaging order'),
            subtitle: error.message,
          });
        });
    },
    [
      session,
      patient,
      initialOrder,
      configOrders.radiologyOrderTypeUuid,
      careSettingUuid,
      clearOrders,
      mutateOrders,
      closeWorkspace,
      t,
    ],
  );

  const cancelOrder = useCallback(() => {
    const conceptUuid = defaultValues?.testType?.conceptUuid || initialOrder?.testType?.conceptUuid;
    if (conceptUuid) {
      setOrders(orders.filter((order) => order.testType.conceptUuid !== conceptUuid));
    }
    setHasUnsavedChanges(false);
    closeWorkspace();
  }, [closeWorkspace, orders, setOrders, defaultValues, initialOrder, setHasUnsavedChanges]);

  const onError = (errors: FieldErrors<ImagingOrderBasketItem>) => {
    if (errors) {
      setShowErrorNotification(true);
    }
  };

  const [showScheduleDate, setShowScheduleDate] = useState(false);

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
      <Form
        className={styles.orderForm}
        onSubmit={handleSubmit(
          initialOrder?.action === 'REVISE' ? submitImagingOrderToServer : handleFormSubmission,
          onError,
        )}>
        <div className={styles.form}>
          <ExtensionSlot name="top-of-imaging-order-form-slot" state={{ order: initialOrder }} />

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
                      titleText={t('testType', 'Test type')}
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
                      items={priorityOptions}
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
                  name="laterality"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <ComboBox
                      size="lg"
                      id="lateralityInput"
                      titleText={t('laterality', 'Laterality')}
                      selectedItem={lateralityItems?.find((option) => option.value === value) || null}
                      items={lateralityItems}
                      onBlur={onBlur}
                      onChange={({ selectedItem }) => onChange(selectedItem?.value || '')}
                      invalid={errors.laterality?.message}
                      invalidText={errors.laterality?.message}
                      itemToString={(item) => item?.label}
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
                  name="bodySite"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <ComboBox
                      size="lg"
                      id="bodySiteInput"
                      titleText={t('bodySite', 'Body Site')}
                      selectedItem={bodySiteItems?.find((option) => option.uuid === value) || null}
                      items={bodySiteItems}
                      onBlur={onBlur}
                      onChange={({ selectedItem }) => onChange(selectedItem?.uuid || '')}
                      invalid={errors.bodySite?.message}
                      invalidText={errors.bodySite?.message}
                      itemToString={(item) => item?.display}
                    />
                  )}
                />
              </InputWrapper>
            </Column>
          </Grid>

          {/* <Grid className={styles.gridRow}>
            <Column lg={16} md={8} sm={4}>
              <InputWrapper>
                <Controller
                  name="modality"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <ComboBox
                      size="lg"
                      id="modalityInput"
                      titleText={t('modality', 'Modality')}
                      selectedItem={modalityItems?.find((option) => option.uuid === value) || null}
                      items={modalityItems}
                      onBlur={onBlur}
                      onChange={({ selectedItem }) => onChange(selectedItem?.uuid || '')}
                      invalid={errors.modality?.message}
                      invalidText={errors.modality?.message}
                      itemToString={(item) => item?.display}
                    />
                  )}
                />
              </InputWrapper>
            </Column>
          </Grid> */}
          {/* <Grid className={styles.gridRow}>
            <Column lg={16} md={8} sm={4}>
              <InputWrapper>
                <Controller
                  name="orderReasonNonCoded"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextArea
                      enableCounter
                      id="orderReasonNonCodedInput"
                      size="lg"
                      labelText={'Order Reason'}
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      maxCount={500}
                      invalid={errors.orderReasonNonCoded?.message}
                      invalidText={errors.orderReasonNonCoded?.message}
                    />
                  )}
                />
              </InputWrapper>
            </Column>
          </Grid> */}
          {/* <Grid className={styles.gridRow}>
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
          <Grid className={styles.gridRow}>
            <Column lg={16} md={8} sm={4}>
              <InputWrapper>
                <Controller
                  name="commentToFulfiller"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextArea
                      enableCounter
                      id="commentsToFulfillerInput"
                      size="lg"
                      labelText={t('commentsToFulfiller', 'Comments To Fulfiller')}
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      maxCount={500}
                      invalid={errors.commentToFulfiller?.message}
                      invalidText={errors.commentToFulfiller?.message}
                    />
                  )}
                />
              </InputWrapper>
            </Column>
          </Grid> */}
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
