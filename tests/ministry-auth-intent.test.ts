import test from 'node:test';
import assert from 'node:assert/strict';
import {recoveryIntent,validRecoveryIntent} from '../apps/ministry/src/lib/auth-intent';
test('password recovery intent is signed and bound to one authenticated account',()=>{
 const previous=process.env.MINISTRY_DATABASE_URL;process.env.MINISTRY_DATABASE_URL='synthetic-signing-material';
 try{const token=recoveryIntent('user-one');assert.ok(validRecoveryIntent(token,'user-one'));assert.equal(validRecoveryIntent(token,'user-two'),false);assert.equal(validRecoveryIntent(token.replace('user-one','user-two'),'user-two'),false);assert.equal(validRecoveryIntent('user-one','user-one'),false);assert.equal(validRecoveryIntent(`${token}extra`,'user-one'),false);}finally{if(previous===undefined)delete process.env.MINISTRY_DATABASE_URL;else process.env.MINISTRY_DATABASE_URL=previous;}
});
