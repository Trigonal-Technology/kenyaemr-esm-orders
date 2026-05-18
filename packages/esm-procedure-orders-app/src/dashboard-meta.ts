import type { DashboardConfig } from "@openmrs/esm-patient-common-lib/src";
export const procedureordersDashboardMeta = {
  slot: 'patient-chart-procedure-orders-dashboard-slot',
  path: 'procedureOrders',
  icon: 'omrs-icon-image-medical',
  title: 'Procedure Orders',
} as const satisfies DashboardConfig;
