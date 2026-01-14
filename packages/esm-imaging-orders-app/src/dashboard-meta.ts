import type { DashboardConfig } from "@openmrs/esm-patient-common-lib/src";
export const radiologyordersDashboardMeta = {
  slot: 'patient-chart-radiology-orders-dashboard-slot',
  path: 'radiologyOrders',
  icon: 'omrs-icon-image-medical',
  title: 'Radiology Orders',
} as const satisfies DashboardConfig;
