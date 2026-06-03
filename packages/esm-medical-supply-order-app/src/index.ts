import { getAsyncLifecycle, defineConfigSchema, getSyncLifecycle, translateFrom } from '@openmrs/esm-framework';
import { configSchema } from './config-schema';
import MedicalSupplyOrderBasketPanelExtension from './form/add-medical-supply-order/medical-supply-order-basket-panel/medical-supply-order-basket-panel.extension';
import AddMedicalSupplyOrderWorkspace from './form/add-medical-supply-order/medical-supply-order/add-medical-supply-order.workspace';
import RejectMedicalSupplyOrderModal from './form/add-medical-supply-order/medical-supply-order/reject-medical-supply-order-modal.component';
import { medicalsupplyDashboardMeta } from './dashboard-meta';
import { createDashboardLink } from '@openmrs/esm-patient-common-lib';
import MedicalSupplyOrdersSummary from './shared/ui/common/medical-supply-orders-summary.component';

const moduleName = '@kenyaemr/esm-medical-supply-orders-app';

const options = {
  featureName: 'esm-medical-supply-orders-app',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

export const medicalsupplyDashboardLink =
  getSyncLifecycle(
    createDashboardLink({
      ...medicalsupplyDashboardMeta,
    }),
    options,
  );

export const root = getAsyncLifecycle(() => import('./root.component'), options);
export const medicalSupplyOrderPanel = getSyncLifecycle(MedicalSupplyOrderBasketPanelExtension, options);
export const addMedicalSupplyOrderWorkspace = getSyncLifecycle(AddMedicalSupplyOrderWorkspace, options);
export const rejectMedicalSupplyOrderModal = getSyncLifecycle(RejectMedicalSupplyOrderModal, options);
export const medicalSupplyOrdersSummary = getSyncLifecycle(MedicalSupplyOrdersSummary, options);
