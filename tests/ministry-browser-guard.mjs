export async function requireIsolatedMinistryServer(base){
 const response=await fetch(`${base}/api/review-status`);
 if(!response.ok||(await response.json()).testMode!==true)throw new Error('Refusing browser writes: start an isolated synthetic DB with MINISTRY_OPERATIONAL_ENABLED=false and MINISTRY_TEST_MODE=true. Never run this suite against the operational ministry server.');
}
