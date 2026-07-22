export type SafetyCaseType = 'emergency' | 'suspicious_activity' | 'complaint' | 'accident';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type SafetyCaseId = string & { readonly __brand: 'SafetyCaseId' };
export type EmergencyType = 'medical' | 'accident' | 'crime' | 'breakdown';
