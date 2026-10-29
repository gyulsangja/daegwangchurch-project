import test from 'node:test';import assert from 'node:assert/strict';
import {unifiedManagementPath,legacyManagementPaths} from '../packages/contracts/src/management-routes';
test('legacy admin destinations map to fixed unified paths without carrying return URLs or credentials',()=>{
 for(const [source,destination] of legacyManagementPaths){assert.equal(unifiedManagementPath(source),destination);assert.equal(unifiedManagementPath(source+'/example/edit'),destination);}
 assert.equal(unifiedManagementPath('/admin'),'/');
 for(const value of ['/admin/notices-other','https://other.test/admin/login','//other.test','/admin/login?next=https://other.test&token=secret'])assert.equal(unifiedManagementPath(value),'/management');
});
