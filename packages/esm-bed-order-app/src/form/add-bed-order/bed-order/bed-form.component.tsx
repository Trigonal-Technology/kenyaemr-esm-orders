import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import { useOrderBasket } from '@openmrs/esm-patient-common-lib';
import { translateFrom, useLayoutType, useSession, useConfig, ExtensionSlot, launchWorkspace, Workspace2DefinitionProps } from '@openmrs/esm-framework';
import {
  Button,
  ButtonSet,
  Column,
  ComboBox,
  Form,
  Layer,
  Grid,
  InlineNotification,
  TextArea,
  DatePicker,
  DatePickerInput,
} from '@carbon/react';
import { useTranslation } from 'react-i18next';

import { Controller, type FieldErrors, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { moduleName } from '../../../constants';
import { type BedOrderConfig } from '../../../config-schema';
import styles from './bed-form.scss';
import { type BedOrderBasketItem } from '../../../types';
import { priorityOptions } from './bed-order';
import { careSettingUuid, createPrepBedOrderPostData, useOrderReasons } from '../api';

export interface BedOrderFormProps {
  closeWorkspace: Workspace2DefinitionProps['closeWorkspace'];
  initialOrder: BedOrderBasketItem;
  orderToEditOrdererUuid?: string;
  orderTypeUuid: string;
  setHasUnsavedChanges: (hasUnsavedChanges: boolean) => void;
  patient: fhir.Patient;
}

// Designs:
//   https://app.zeplin.io/project/60d5947dd636aebbd63dce4c/screen/640b06c440ee3f7af8747620
//   https://app.zeplin.io/project/60d5947dd636aebbd63dce4c/screen/640b06d286e0aa7b0316db4a
export function BedOrderForm({
  initialOrder,
  orderToEditOrdererUuid,
  closeWorkspace,
  orderTypeUuid,
  setHasUnsavedChanges,
  patient,
}: BedOrderFormProps) {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const session = useSession();

  const config = useConfig<BedOrderConfig>();
  const { orders: configOrders, careSettingUuid, admissionReasonConceptSetUuid, wardConceptSetUuid } = config;
  const { orders, setOrders } = useOrderBasket<BedOrderBasketItem>(patient, orderTypeUuid, createPrepBedOrderPostData(configOrders.bedOrderTypeUuid, careSettingUuid));

  const [showErrorNotification, setShowErrorNotification] = useState(false);

  const bedOrderFormSchema = z.object({
    instructions: z.string().optional(),
    urgency: z.string().refine((value) => value !== '', {
      message: translateFrom(moduleName, 'addBedOrderPriorityRequired', 'Priority is required'),
    }),
    testType: z.object(
      { label: z.string(), conceptUuid: z.string() },
      {
        required_error: translateFrom(
          moduleName,
          'addMedOrderBedTypeRequired',
          'Bed type is required',
        ),
      },
    ),
    commentsToFulfiller: z.string().optional(),
    admissionDate: z.date({
      required_error: translateFrom(moduleName, 'admissionDateRequired', 'Admission date is required'),
    }),
    ward: z.string().refine((value) => value !== '', {
      message: translateFrom(moduleName, 'wardRequired', 'Ward is required'),
    }),
    // admissionReason: z.string().refine((value) => value !== '', {
    //   message: translateFrom(moduleName, 'admissionReasonRequired', 'Admission reason is required'),
    // }),
  });

  const {
    control,
    handleSubmit,
    formState: { errors, defaultValues, isDirty },
  } = useForm<BedOrderBasketItem>({
    mode: 'all',
    resolver: zodResolver(bedOrderFormSchema),
    defaultValues: {
      ...initialOrder,
    },
  });
  const { orderReasons: admissionReasons, isLoading: isLoadingReasons } = useOrderReasons([
    admissionReasonConceptSetUuid,
  ]);
  const { orderReasons: wards, isLoading: isLoadingWards } = useOrderReasons([wardConceptSetUuid]);

  const handleFormSubmission = useCallback(
    (data: BedOrderBasketItem) => {
      data.action = 'NEW';
      data.careSetting = careSettingUuid;
      data.orderer = session.currentProvider.uuid;
      const newOrders = [...orders];
      const existingOrder = orders.find((order) => order.testType.conceptUuid == defaultValues.testType.conceptUuid);
      const orderIndex = existingOrder ? orders.indexOf(existingOrder) : orders.length;
      newOrders[orderIndex] = data;
      setOrders(newOrders);
      closeWorkspace();
    },
    [orders, setOrders, session?.currentProvider?.uuid, defaultValues, closeWorkspace],
  );

  const cancelOrder = useCallback(() => {
    setOrders(orders.filter((order) => order.testType.conceptUuid !== defaultValues.testType.conceptUuid));
    closeWorkspace();
  }, [closeWorkspace, orders, setOrders, defaultValues]);

  const onError = (errors: FieldErrors<BedOrderBasketItem>) => {
    if (errors) {
      setShowErrorNotification(true);
    }
  };

  return (
    <>
      <Form
        className={styles.orderForm}
        onSubmit={handleSubmit(handleFormSubmission, onError)}
        id="bedOrderForm">
        <div className={styles.form}>
          <ExtensionSlot name="top-of-bed-order-form-slot" state={{ order: initialOrder }} />

          <Grid className={styles.gridRow}>
            <Column lg={16} md={8} sm={4}>
              <InputWrapper>
                <Controller
                  name="testType"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <ComboBox
                      size="lg"
                      id="bedTypeInput"
                      titleText={t('bedType', 'Bed type')}
                      selectedItem={value}
                      onBlur={onBlur}
                      onChange={({ selectedItem }) => {
                        onChange(selectedItem);
                      }}
                      items={[]}
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
                      }}
                      invalid={errors.urgency?.message}
                      invalidText={errors.urgency?.message}
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
                  name="admissionDate"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <DatePicker
                      datePickerType="single"
                      onChange={(dates) => onChange(dates[0])}
                      onBlur={onBlur}
                      value={value}>
                      <DatePickerInput
                        id="admissionDateInput"
                        placeholder="mm/dd/yyyy"
                        labelText={t('admissionDate', 'Admission date & time')}
                        size="lg"
                        invalid={!!errors.admissionDate}
                        invalidText={errors.admissionDate?.message}
                      />
                    </DatePicker>
                  )}
                />
              </InputWrapper>
            </Column>
          </Grid>
          <Grid className={styles.gridRow}>
            <Column lg={8} md={8} sm={4}>
              <InputWrapper>
                <Controller
                  name="ward"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <ComboBox
                      size="lg"
                      id="wardInput"
                      titleText={t('ward', 'Ward')}
                      selectedItem={wards?.find((option) => option.uuid === value) || null}
                      items={wards}
                      itemToString={(item) => (item ? item?.display : '')}
                      onBlur={onBlur}
                      onChange={({ selectedItem }) => {
                        onChange(selectedItem?.uuid || '');
                      }}
                      invalid={!!errors.ward}
                      invalidText={errors.ward?.message}
                    />
                  )}
                />
              </InputWrapper>
            </Column>
            {/* <Column lg={8} md={8} sm={4}>
              <InputWrapper>
                <Controller
                  name="admissionReason"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <ComboBox
                      size="lg"
                      id="admissionReasonInput"
                      titleText={t('admissionReason', 'Reason for admission')}
                      selectedItem={admissionReasons?.find((option) => option.uuid === value) || null}
                      items={admissionReasons}
                      itemToString={(item) => (item ? item?.display : '')}
                      onBlur={onBlur}
                      onChange={({ selectedItem }) => {
                        onChange(selectedItem?.uuid || '');
                      }}
                      invalid={!!errors.admissionReason}
                      invalidText={errors.admissionReason?.message}
                    />
                  )}
                />
              </InputWrapper>
            </Column> */}
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
