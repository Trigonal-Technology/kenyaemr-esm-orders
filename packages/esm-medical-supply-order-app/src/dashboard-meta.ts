import type { DashboardConfig } from "@openmrs/esm-patient-common-lib/src";
export const medicalsupplyDashboardMeta = {
  slot: 'patient-chart-medical-supply-dashboard-slot',
  path: 'medicalSupply',
  icon: 'omrs-icon-syringe',
  title: 'Medical Supply',
} as const satisfies DashboardConfig;
