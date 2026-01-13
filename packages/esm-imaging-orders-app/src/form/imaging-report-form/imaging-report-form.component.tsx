import React, { useCallback, useEffect, useMemo } from 'react';
import { mutate } from 'swr';
import { useTranslation } from 'react-i18next';
import {
  createAttachment,
  type DefaultWorkspaceProps,
  ExtensionSlot,
  ResponsiveWrapper,
  showModal,
  showNotification,
  showSnackbar,
  type UploadedFile,
  useLayoutType,
  usePatient,
} from '@openmrs/esm-framework';
import { useAllowedFileExtensions } from '@openmrs/esm-patient-common-lib';
import { Stack, Button, TextArea, ButtonSet, InlineLoading, SkeletonPlaceholder } from '@carbon/react';
import { DocumentAttachment } from '@carbon/react/icons';
import { Controller, useForm } from 'react-hook-form';
import classNames from 'classnames';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { type Result } from '../../imaging-tabs/work-list/work-list.resource';
import { saveRadiologyReport, useGetOrderConceptByUuid } from './imaging.resource';

import styles from './imaging-report-form.scss';

type ResultFormProps = DefaultWorkspaceProps & {
  patientUuid: string;
  order: Result;
};

const imagingReportSchema = z.object({
  // radiologyReport: z.string({ required_error: 'Imaging report is required' }).min(1, {
  //   message: 'Imaging report is required',
  // }),
  findings: z.string({ required_error: 'Findings are required' }).min(1, {
    message: '',
  }),
  impressions: z.string({ required_error: 'Impressions are required' }).min(1, {
    message: '',
  }),
  recommendations: z.string().optional(),
});

type ImagingReportFormData = z.infer<typeof imagingReportSchema>;

const ImagingReportForm: React.FC<ResultFormProps> = ({
  order,
  patientUuid,
  closeWorkspace,
  closeWorkspaceWithSavedChanges,
  promptBeforeClosing,
}) => {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const { patient, isLoading } = usePatient(patientUuid);
  const { allowedFileExtensions } = useAllowedFileExtensions();
  const { concept, isLoading: isLoadingConcepts } = useGetOrderConceptByUuid(order.concept.uuid);
  const schemaWithTranslations = imagingReportSchema.extend({
    findings: z.string().min(1, { message: t('findingsRequiredMessage', 'Findings are required') }),
    impressions: z.string().min(1, { message: t('ImpressionsRequiredMessage', 'impressions are required') }),
  });
  const {
    formState: { isSubmitting, errors, isDirty },
    control,
    handleSubmit,
  } = useForm<ImagingReportFormData>({
    defaultValues: {
      // procedureReport: '',
      findings: '',
      impressions: '',
      recommendations: ''
    },
    resolver: zodResolver(schemaWithTranslations),
    mode: 'all',
  });

  const bannerState = useMemo(() => {
    if (patient) {
      return {
        patient,
        patientUuid,
        hideActionsOverflow: true,
      };
    }
  }, [patient, patientUuid]);

  useEffect(() => {
    if (promptBeforeClosing && isDirty) {
      promptBeforeClosing(() => isDirty);
    }
  }, [promptBeforeClosing, isDirty, closeWorkspace]);

  const showAddAttachmentModal = useCallback(() => {
    const close = showModal('capture-photo-modal', {
      saveFile: (file: UploadedFile) => createAttachment(patientUuid, file),
      allowedExtensions: allowedFileExtensions,
      closeModal: () => close(),
      multipleFiles: true,
      collectDescription: true,
    });
  }, [allowedFileExtensions, patientUuid]);

  const onSubmit = async (formData: ImagingReportFormData) => {
    const reportPayload = {
      patient: patientUuid,
      radiologyOrder: order.uuid,
      concept: order.concept.uuid,
      status: 'COMPLETED',
      // radiologyReport: formData.radiologyReport, 
      radiologyFindings: formData.findings,
      radiologyImpressions: formData.impressions,
      radiologyRecommendations: formData.recommendations,
      encounters: [],
    };

    try {
      const response = await saveRadiologyReport(reportPayload);
      if (response.ok) {
        showSnackbar({
          title: t('imagingOrderSaveSuccess', 'Imaging order saved successfully'),
          kind: 'success',
          subtitle: t(
            'imagingOrderSaveSuccessSubtitle',
            'Imaging order saved successfully. Report transitioned to awaiting approval.',
          ),
          isLowContrast: true,
        });
        closeWorkspaceWithSavedChanges();
        mutate((key) => typeof key === 'string' && key.startsWith('/ws/rest/v1/order'), undefined, {
          revalidate: true,
        });
      }
    } catch (error) {
      showNotification({
        title: t('errorSavingReport', 'Error occurred while saving the report'),
        kind: 'error',
        critical: true,
        description: error?.message,
      });
    }
  };

  if (isLoadingConcepts || isLoading) {
    return <SkeletonPlaceholder />;
  }

  return (
    <>
      {patient ? (
        <ExtensionSlot name="patient-header-slot" state={bannerState} />
      ) : (
        <InlineLoading status="active" iconDescription="Loading" />
      )}
      <form aria-label="imaging form" className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.formContainer}>
          <h6>{concept?.display}</h6>
          {/* <Stack gap={7} className={styles.formStackControl}>
            <ResponsiveWrapper>
              <Controller
                control={control}
                name="radiologyReport"
                render={({ field }) => (
                  <TextArea
                    labelText={concept?.display}
                    id="radiologyReport"
                    name="radiologyReport"
                    invalid={!!errors.radiologyReport}
                    invalidText={errors.radiologyReport?.message}
                    {...field}
                  />
                )}
              />
            </ResponsiveWrapper>
          </Stack> */}
          <Stack gap={7} className={styles.formStackControl}>
            <ResponsiveWrapper>
              <Controller
                control={control}
                name="findings"
                rules={{ required: t('findingsRequiredMessage','Findings are required') }}
                render={({ field }) => (
                  <TextArea
                      labelText={t('findingsLabel', 'Findings')}
                      id="findings"
                      name="findings"
                      invalid={!!errors.findings}
                      invalidText={errors.findings?.message}
                      {...field}
                  />
                )}
                />
            </ResponsiveWrapper>
          </Stack>
          <Stack gap={7} className={styles.formStackControl}>
            <ResponsiveWrapper>
              <Controller
                control={control}
                name="impressions"
                rules={{ required: t('impressionsRequiredMessage','Impressions are required') }}
                render={({ field }) => (
                  <TextArea
                      labelText={t('impressionsLabel', 'Impressions')}
                      id="impressions"
                      name="impressions"
                      invalid={!!errors.impressions}
                      invalidText={errors.impressions?.message}
                      {...field}
                    />
                )}
                />
            </ResponsiveWrapper>
          </Stack>
          <Stack gap={7} className={styles.formStackControl}>
            <ResponsiveWrapper>
              <Controller
                control={control}
                name="recommendations"
                render={({ field }) => (
                  <TextArea
                      labelText={t('recommendationsLabel', 'Recommendations')}
                      id="recommendations"
                      name="recommendations"
                      invalid={!!errors.recommendations}
                      invalidText={errors.recommendations?.message}
                      {...field}
                    />
                )}
                />
            </ResponsiveWrapper>
            <Button kind="tertiary" renderIcon={DocumentAttachment} onClick={showAddAttachmentModal}>
              {t('addAttachment', 'Add attachment')}
            </Button>
          </Stack>
        </div>
        <ButtonSet className={classNames({ [styles.tablet]: isTablet, [styles.desktop]: !isTablet })}>
          <Button style={{ maxWidth: '50%' }} kind="secondary" onClick={closeWorkspace}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button
            disabled={isSubmitting || Object.keys(errors).length > 0}
            style={{ maxWidth: '50%' }}
            kind="primary"
            type="submit">
            {isSubmitting ? (
              <span style={{ display: 'flex', justifyItems: 'center' }}>
                {t('submitting', 'Submitting...')} <InlineLoading status="active" iconDescription="Loading" />
              </span>
            ) : (
              t('saveAndClose', 'Save & close')
            )}
          </Button>
        </ButtonSet>
      </form>
    </>
  );
};

export default ImagingReportForm;
