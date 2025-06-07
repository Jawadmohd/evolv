export type ApiErrorResponse = {
  timestamp?: string;
  status: number;
  error?: string;
  message: string;
  details?: string[];
  path?: string;
};

export type ApiExtraOptions = {
  skipGlobalError?: boolean;
};
