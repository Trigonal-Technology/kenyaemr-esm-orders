import React, { useState } from 'react';
import { Button, Form, ModalFooter, TextArea } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import styles from './reject-medical-supply-order-modal.scss';
import { showNotification, showSnackbar } from '@openmrs/esm-framework';
import { mutate } from 'swr';
import { updateOrder } from '../api';
import capitalize from 'lodash-es/capitalize';

interface RejectMedicalSupplyOrderModalProps {
    order: any;
    closeModal: () => void;
}

const RejectMedicalSupplyOrderModal: React.FC<RejectMedicalSupplyOrderModalProps> = ({ order, closeModal }) => {
    const { t } = useTranslation();
    const [notes, setNotes] = useState('');

    const rejectOrder = async (event) => {
        event.preventDefault();

        const payload = {
            fulfillerStatus: 'DECLINED',
            fulfillerComment: notes,
        };

        updateOrder(order.uuid, payload).then(
            () => {
                showSnackbar({
                    isLowContrast: true,
                    title: t('rejectOrder', 'Rejected Order'),
                    kind: 'success',
                    subtitle: t(
                        'successfullyRejected',
                        `You have successfully rejected an Order with OrderNumber {{orderNumber}} `,
                        { orderNumber: order.orderNumber },
                    ),
                });
                closeModal();
                mutate((key) => typeof key === 'string' && key.startsWith('/ws/rest/v1/order'), undefined, {
                    revalidate: true,
                });
            },
            (err) => {
                showNotification({
                    title: t('errorRejectingOrder', 'Error Rejecting a order'),
                    kind: 'error',
                    critical: true,
                    description: err?.message,
                });
            },
        );
    };

    const orderName = capitalize(order?.display);
    const orderNumber = order?.orderNumber;

    return (
        <div>
            <Form onSubmit={rejectOrder}>
                <div className="cds--modal-header">
                    <h3 className="cds--modal-header__heading">{t('rejectMedicalSupplyOrder', 'Reject Medical Supply Order')}</h3>
                </div>
                <div className="cds--modal-content">
                    <p>
                        {t('confirmationRejectMessages', `Do you want to reject this order: {{orderName}} - {{orderNumber}}?`, {
                            orderName,
                            orderNumber,
                        })}
                    </p>
                    <section className={styles.section}>
                        <TextArea
                            labelText={t('notes', 'Enter Comments ')}
                            id="nextNotes"
                            name="nextNotes"
                            invalidText="Required"
                            helperText={t('pleaseEnterComment', 'Please enter comment')}
                            maxCount={500}
                            enableCounter
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </section>
                </div>

                <ModalFooter>
                    <Button kind="secondary" onClick={closeModal}>
                        {t('cancel', 'Cancel')}
                    </Button>
                    <Button kind="danger" type="submit">
                        {t('rejectOrder', 'Reject Order')}
                    </Button>
                </ModalFooter>
            </Form>
        </div>
    );
};

export default RejectMedicalSupplyOrderModal;
