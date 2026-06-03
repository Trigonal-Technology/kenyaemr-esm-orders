import Root from './root.component';
import { moduleName } from './constants';
import { configSchema } from './config-schema';

import { defineConfigSchema, getAsyncLifecycle, getSyncLifecycle } from '@openmrs/esm-framework';
import { createLeftPanelLink } from './left-panel-link';
import RejectImagingOrderModal from './imaging-tabs/test-ordered/reject-order-dialog/reject-order-dialog.component';
import ImagingReportForm from './form/imaging-report-form/imaging-report-form.component';

import ImagingOrderBasketPanelExtension from './form/imaging-orders/imaging-order-basket-panel/imaging-order-basket-panel.extension';
import AddImagingToWorkListModal from './imaging-tabs/test-ordered/pick-imaging-order/add-to-worklist-dialog.component';
import AmendModal from './imaging-tabs/test-ordered/amend-order-dialog/amend-imaging-dialog.component';
import ImagingReviewForm from './form/review-form/review-imaging-form.workspace';
import PrintPreviewModal from './print/print-report-modal.component';
import SearchPatientWorkspace from './form/imaging-orders/search-patient.workspace';
import ImagingOrders from './imaging-orders.component';
import { radiologyordersDashboardMeta } from './dashboard-meta';
import { createDashboardLink } from '@openmrs/esm-patient-common-lib';
import RadiologyOrdersSummary from './shared/ui/common/radiology-orders-summary.component';

const options = {
  featureName: 'esm-imaging-orders-app',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

export const root = getSyncLifecycle(Root, options);
export const radiologyDashboard = getSyncLifecycle(ImagingOrders, options);

// t('radiologyAndImaging', 'Radiology and Imaging')
export const imagingOrdersLink = getSyncLifecycle(
  createLeftPanelLink({
    name: 'imaging-orders',
    title: 'Radiology and Imaging',
  }),
  options,
);

export const radiologyordersDashboardLink =
  getSyncLifecycle(
    createDashboardLink({
      ...radiologyordersDashboardMeta,
    }),
    options,
  );

// Modals

export const imagingOrderPanel = getSyncLifecycle(ImagingOrderBasketPanelExtension, options);
export const rejectImagingOrderModal = getSyncLifecycle(RejectImagingOrderModal, options);
export const printReportModal = getSyncLifecycle(PrintPreviewModal, options);

// t('addImagingOrderWorkspaceTitle', 'Add Imaging order')
export const addImagingOrderWorkspace = getAsyncLifecycle(
  () => import('./form/imaging-orders/add-imaging-orders/add-imaging-order.workspace'),
  options,
);
export const searchPatientWorkspace = getSyncLifecycle(SearchPatientWorkspace, options);

export const imagingReportForm = getSyncLifecycle(ImagingReportForm, options);
export const imagingReviewForm = getSyncLifecycle(ImagingReviewForm, options);
export const addImagingToWorkListModal = getSyncLifecycle(AddImagingToWorkListModal, options);
export const amendModal = getSyncLifecycle(AmendModal, options);
export const imagingResultsComponent = getAsyncLifecycle(() => import('./imaging-results/imaging-results.component'), options);

// Radiology Orders Summary
export const radiologyOrdersSummary = getSyncLifecycle(RadiologyOrdersSummary, options);



