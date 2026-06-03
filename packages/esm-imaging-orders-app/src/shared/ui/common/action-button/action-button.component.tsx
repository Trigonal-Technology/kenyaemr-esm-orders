import React, { useState, useCallback } from 'react';
import { mutate } from 'swr';
import { useTranslation } from 'react-i18next';
import { Button, IconButton, Modal, Tile } from '@carbon/react';
import {
  showModal,
  launchWorkspace2,
  ViewIcon,
  ExtensionSlot,
  openmrsFetch,
  restBaseUrl,
  useConfig,
} from '@openmrs/esm-framework';
import { type ImagingConfig } from '../../../../config-schema';
import { type Result } from '../../../../imaging-tabs/work-list/work-list.resource';
import styles from './action-button.scss';

type ActionButtonProps = {
  action: {
    actionName: string;
    order: number;
  };
  order: Result;
  patientUuid: string;
  size?: 'sm' | 'md' | 'lg';
};

const ActionButton: React.FC<ActionButtonProps> = ({ action, order, patientUuid, size = 'md' }) => {
  const { t } = useTranslation();
  const { radiologyReportFormUuid, ohifViewerUrl } = useConfig<ImagingConfig>();

  const [showForm, setShowForm] = useState(false);

  const handleOpenImagingReportForm = () => {
    setShowForm(true);
  };

  const handleSubmitResponse = useCallback(() => {
    return openmrsFetch(`${restBaseUrl}/order/${order.uuid}/fulfillerdetails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        fulfillerStatus: 'COMPLETED',
        fulfillerComment: '',
      },
    })
      .then(() => {
        mutate((key) => typeof key === 'string' && key.includes('/order'));
        setShowForm(false);
      })
      .catch((error) => {
        console.error('Error updating fulfiller details:', error);
        setShowForm(false);
      });
  }, [order.uuid]);

  const handleOpeningReviewWorkspace = () => {
    launchWorkspace2('imaging-review-form', {
      order,
    });
  };

  const renderActionButton = () => {
    switch (action.actionName) {
      case 'add-imaging-to-work-list-modal':
        return (
          <Button
            kind='primary'
            size={size}
            onClick={() => {
              const dispose = showModal(action.actionName, {
                closeModal: () => dispose(),
                order: order,
              });
            }}>
            {t('pickOrder', 'Pick Order')}
          </Button>
        );

      case 'view-radiology-report':
        return (
          <IconButton
            label="View Image"
            align="left"
            kind="ghost"
            disabled={!order.accessionNumber}
            onClick={() => {
              if (order.accessionNumber) {
                const baseUrl = ohifViewerUrl.startsWith('http') ? ohifViewerUrl : window.location.origin + ohifViewerUrl;
                window.open(`${baseUrl}?StudyInstanceUIDs=${order.accessionNumber}`, '_blank');
              }
            }}
          >
            <ViewIcon />
          </IconButton>
        );

      case 'imaging-report-form':
        return (
          <Button kind="primary" size={size} onClick={handleOpenImagingReportForm} className={styles.actionButtons}>
            {t('imagingReportForm', 'Imaging Report Form')}
          </Button>
        );

      case 'complete-imaging-order':
        return (
          <Button kind="primary" size={size} onClick={handleSubmitResponse} className={styles.actionButtons}>
            {t('completeImagingOrder', 'Mark Complete')}
          </Button>
        );

      case 'imaging-review-form':
        return (
          <Button kind="primary" size={size} className={styles.actionButtons} onClick={handleOpeningReviewWorkspace}>
            {t('reviewImagingReport', 'Review Imaging Report')}
          </Button>
        );

      case 'amend-imaging-order-modal':
        return (
          <Button
            kind="secondary"
            size={size}
            className={styles.actionButtons}
            onClick={() => {
              const dispose = showModal('amend-imaging-order-modal', {
                closeModal: () => dispose(),
                order: order,
              });
            }}>
            {t('amendRequest', 'Amend request')}
          </Button>
        );

      case 'reject-imaging-order-modal':
        return (
          <Button
            kind="danger"
            size={size}
            className={styles.actionButtons}
            onClick={() => {
              const dispose = showModal('reject-imaging-order-modal', {
                closeModal: () => dispose(),
                order: order,
              });
            }}>
            {t(
              action.actionName.replace(/-/g, ''),
              action.actionName
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
                .replace('Modal', ''),
            )}
          </Button>
        );
      
      case 'reject-reason-message':
        return (
          <section className={styles.section}>
            <b />
            <Tile>
              <p>
                <b><strong>Rejection Reason:</strong></b>
              </p>
              <p className={styles.instructions}>{order.fulfillerComment}</p>
            </Tile>
          </section>
        )

      default:
        return null;
    }
  };

  return (
    <div className={styles.actionButtonContainer}>
      {renderActionButton()}
      {showForm && (
        <Modal
          open={showForm}
          onRequestClose={() => setShowForm(false)}
          modalHeading={t('imagingReportForm', 'Imaging Report Form')}
          passiveModal
          size="lg">
          <ExtensionSlot
            name="form-widget-slot"
            state={{
              view: 'form',
              formUuid: radiologyReportFormUuid,
              patientUuid,
              patient: {
                ...order.patient,
                id: order.patient?.uuid,
              },
              encounterUuid: '',
              visitUuid: null,
              additionalProps: {
                mode: 'enter',
              },
              showDiscardSubmitButtons: true,
              handlePostResponse: handleSubmitResponse,
              closeWorkspace: () => setShowForm(false),
              closeWorkspaceWithSavedChanges: handleSubmitResponse,
              promptBeforeClosing: () => { },
              setHasUnsavedChanges: () => { },
            }}
          />
        </Modal>
      )}
    </div>
  );
};

export default ActionButton;
