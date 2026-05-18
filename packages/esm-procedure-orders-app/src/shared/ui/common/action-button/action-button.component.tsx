import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal, Tile } from '@carbon/react';
import {
  showModal,
  ExtensionSlot,
  openmrsFetch,
  restBaseUrl,
  useConfig,
} from '@openmrs/esm-framework';
import { mutate } from 'swr';
import { type Result } from '../../../../types';
import { type ConfigObject } from '../../../../config-schema';
import styles from './action-button.scss';

type ActionButtonProps = {
  action: {
    actionName: string;
  };
  order: Result;
  patientUuid: string;
  onOpenForm?: () => void;
};

const ActionButton: React.FC<ActionButtonProps> = ({ action, order, patientUuid, onOpenForm }) => {
  const { t } = useTranslation();

  const handleOpenProcedureResultForm = () => {
    onOpenForm?.();
  };
  switch (action.actionName) {
    case 'add-procedure-to-worklist-dialog':
      // return <OrderActionExtension order={order as unknown as Order} />;
      return (
        <Button
          kind='primary'
          size='md'
          onClick={() => {
            const dispose = showModal(action.actionName, {
              closeModal: () => dispose(),
              order: order,
            });
          }}>
          {t('pickOrder', 'Pick Order')}
        </Button>
      );

    case 'postProcedureResultForm':
      return (
        <Button kind="primary" onClick={handleOpenProcedureResultForm} size="md" className={styles.actionButtons}>
          {t('procedureResultForm', 'Procedure Result Form')}
        </Button>
      );

    case 'reject-procedure-order-dialog':
      return (
        <Button
          kind={action.actionName === 'reject-procedure-order-dialog' ? 'danger' : 'tertiary'}
          onClick={() => {
            const dispose = showModal(action.actionName, {
              closeModal: () => dispose(),
              order: order,
            });
          }}
          size="md"
          className={styles.actionButtons}>
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

const ActionButtonContainer: React.FC<ActionButtonProps> = (props) => {
  const { t } = useTranslation();
  const { patientUuid, order } = props;
  const { procedureReportFormUuid } = useConfig<ConfigObject>();
  const [showForm, setShowForm] = useState(false);

  const handleOpenProcedureResultForm = () => {
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

  return (
    <div className={styles.actionButtonContainer}>
      <ActionButton {...props} onOpenForm={handleOpenProcedureResultForm} />
      {showForm && (
        <Modal
          open={showForm}
          onRequestClose={() => setShowForm(false)}
          modalHeading={t('procedureResultForm', 'Procedure Result Form')}
          passiveModal
          size="lg">
          <ExtensionSlot
            name="form-widget-slot"
            state={{
              view: 'form',
              formUuid: procedureReportFormUuid,
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
              promptBeforeClosing: () => {},
              setHasUnsavedChanges: () => {},
            }}
          />
        </Modal>
      )}
    </div>
  );
};

export default ActionButtonContainer;
