export interface Reading {
  [key: string]: any; // Allow dynamic columns
  Date?: string | Date | null;
  Time?: string | Date | number | null;
  Timestamp?: string; // string ISO format
  "Subject Name"?: string;
  Gender?: string;
  "Age Group"?: string;
  "VinCense Readings"?: number;
  Circumstance?: string;
}

export interface DataSheet {
  name: string;
  data: Reading[];
}

export type DataDict = Record<string, Reading[]>;

export interface FilterState {
  subject: string;
  date: string;
}
