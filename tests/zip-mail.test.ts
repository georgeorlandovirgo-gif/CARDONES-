import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculateZipMailPostage,ZIP_MAIL_BASE_RATES_JMD,ZIP_MAIL_EXTRA_COVERAGE_MAX_JMD} from '../src/lib/zip-mail';

test('Jamaica Post published first-10lb rates for all four delivery modes',()=>{
 assert.deepEqual(ZIP_MAIL_BASE_RATES_JMD,{post_to_post:500,post_to_door:850,door_to_post:850,door_to_door:1000});
 for(const [mode,expected] of Object.entries(ZIP_MAIL_BASE_RATES_JMD)){
  const quote=calculateZipMailPostage(10,mode as keyof typeof ZIP_MAIL_BASE_RATES_JMD);
  assert.equal(quote.customerPostageTotalJmd,expected);
  assert.equal(quote.extraPostageJmd,0);
  assert.equal(quote.requiresCustomerApproval,false);
 }
});

test('The business covers every extra pound up to J$1,500 per order',()=>{
 assert.equal(ZIP_MAIL_EXTRA_COVERAGE_MAX_JMD,1500);
 const ten=calculateZipMailPostage(10);
 assert.equal(ten.customerPostageTotalJmd,500);
 const fraction=calculateZipMailPostage(10.01);
 assert.equal(fraction.chargeableExtraLbs,1);
 assert.equal(fraction.extraPostageJmd,50);
 assert.equal(fraction.cardonesContributionJmd,50);
 assert.equal(fraction.additionalCustomerJmd,0);
 const heavy=calculateZipMailPostage(40);
 assert.equal(heavy.extraPostageJmd,1500);
 assert.equal(heavy.cardonesContributionJmd,1500);
 assert.equal(heavy.customerPostageTotalJmd,500);
 assert.equal(heavy.requiresCustomerApproval,false);
});

test('Only the amount above J$1,500 is due from customer and requires approval',()=>{
 const beyond=calculateZipMailPostage(40.1);
 assert.equal(beyond.chargeableExtraLbs,31);
 assert.equal(beyond.extraPostageJmd,1550);
 assert.equal(beyond.cardonesContributionJmd,1500);
 assert.equal(beyond.additionalCustomerJmd,50);
 assert.equal(beyond.customerPostageTotalJmd,550);
 assert.equal(beyond.requiresCustomerApproval,true);
 for(const invalid of [0,-1,NaN,Infinity])assert.throws(()=>calculateZipMailPostage(invalid));
});
