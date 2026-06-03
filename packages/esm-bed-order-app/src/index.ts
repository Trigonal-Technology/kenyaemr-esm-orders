import { getAsyncLifecycle, defineConfigSchema, getSyncLifecycle, translateFrom } from '@openmrs/esm-framework';
import { configSchema } from './config-schema';
import BedBasketPanelExtension from './form/add-bed-order/bed-order-basket-panel/bed-order-basket-panel.extension';
import AddBedOrderWorkspace from './form/add-bed-order/bed-order/add-bed-order.workspace';

const moduleName = '@kenyaemr/esm-bed-orders-app';

const options = {
  featureName: 'esm-bed-orders-app',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

export const root = getAsyncLifecycle(() => import('./root.component'), options);
export const bedOrderPanel = getSyncLifecycle(BedBasketPanelExtension, options);
export const addBedOrderWorkspace = getSyncLifecycle(AddBedOrderWorkspace, options);
