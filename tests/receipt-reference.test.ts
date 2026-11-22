import {test} from 'node:test';
import assert from 'node:assert/strict';
import {receiptReferences} from '../src/lib/receipt-reference';
test('Receipt reading selects labelled bank IDs and preserves ambiguous characters',()=>{
 assert.deepEqual(receiptReferences('Transaction ID: TEST12345678'),['TEST12345678']);
 assert.deepEqual(receiptReferences('Receipt number\nAB01O23456'),['AB01O23456']);
 assert.deepEqual(receiptReferences('Reference No. 123456789'),['123456789']);
 assert.deepEqual(receiptReferences('Confirmation code: ABC123\nTransaction ID: XYZ456'),['ABC123','XYZ456']);
 assert.deepEqual(receiptReferences('Invoice reference number: CAR-20261122-ABC123\nAccount number: 12345678\nAmount: 1800.00'),[]);
 assert.deepEqual(receiptReferences('Reference number: 2026-11-22'),[]);
 assert.deepEqual(receiptReferences('Transaction ID: ABC123\nTransaction ID: ABC123'),['ABC123']);
});
