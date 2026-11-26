/**
 * Jamaica Post's Zip Mail domestic published rate sheet, effective 1 July 2022.
 * Jamaica Post continues to link this PDF on its Zip Mail service page.
 * Review this rate before changing any live customer pricing.
 */
export const ZIP_MAIL_RATE_SOURCE='https://jamaicapost.gov.jm/wp-content/uploads/2024/06/Zip-Rate-July-1-22.pdf';
export const ZIP_MAIL_RATE_EFFECTIVE='2022-07-01';
export const ZIP_MAIL_FIRST_10_LBS=10;
export const ZIP_MAIL_EXTRA_POUND_JMD=50;
export const ZIP_MAIL_EXTRA_COVERAGE_MAX_JMD=1500;
export const ZIP_MAIL_BASE_RATES_JMD={
 post_to_post:500,
 post_to_door:850
} as const;
export type ZipMailMode=keyof typeof ZIP_MAIL_BASE_RATES_JMD;

/**
 * This is an internal rate calculation, not a checkout weight estimate.
 * All order weights MUST be measured including packaging before quoting excess charges.
 * Cardone’s takes all parcels to the post office itself; only Post-to-Post and Post-to-Door apply.
 */
export function calculateZipMailPostage(weightLbs:number,mode:ZipMailMode='post_to_post'){
 if(!Number.isFinite(weightLbs)||weightLbs<=0)throw Error('A verified positive parcel weight is required.');
 const baseJmd=ZIP_MAIL_BASE_RATES_JMD[mode];
 const additionalLbs=Math.max(0,Math.ceil((weightLbs-ZIP_MAIL_FIRST_10_LBS)*1e6)/1e6);
 // Convert the excess to charged whole pounds (each fraction counts as another pound).
 const chargeableExtraLbs=Math.ceil(additionalLbs);
 const extraPostageJmd=chargeableExtraLbs*ZIP_MAIL_EXTRA_POUND_JMD;
 const cardonesContributionJmd=Math.min(extraPostageJmd,ZIP_MAIL_EXTRA_COVERAGE_MAX_JMD);
 const additionalCustomerJmd=extraPostageJmd-cardonesContributionJmd;
 return {
  baseJmd,
  chargeableExtraLbs,
  extraPostageJmd,
  cardonesContributionJmd,
  additionalCustomerJmd,
  customerPostageTotalJmd:baseJmd+additionalCustomerJmd,
  requiresCustomerApproval:additionalCustomerJmd>0
 };
}
