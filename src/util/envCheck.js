// env strings
export const STAGING_STR = 'STAGING';
export const PRODUCTION_STR = 'PRODUCTION';
export const STAGING_URL = 'https://staging.bluehorizon.network';
export const PRODUCTION_URL ='https://bluehorizon.network';

// Use the exchange url to detect what env we are in
// If the url contains staging, then so be it. Else, production
export function getEnv(exchangeUrl) {
  if (exchangeUrl.indexOf('staging') > -1) return STAGING_STR;
  else return PRODUCTION_STR;
}

export function getBaseUrl(exchangeUrl) {
  if (exchangeUrl.indexOf('staging') > -1) return STAGING_URL;
  else return PRODUCTION_URL;
}