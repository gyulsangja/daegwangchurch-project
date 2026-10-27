// Explicit allowlist: new/unknown operations keep the locked mutation path.
// Every domain needs years for active-year and department authorization checks.
const plans:Record<string,readonly string[]>={
 'root.config':['years','organizations'],
 'root.list':['years','members'],
 'root.linkCandidates':['years','members'],
 'root.options':['years','members'],
 'root.overview':['years','members'],
 'root.detail':['years','members','families','audits'],
 'years.list':['years'],
 'years.targets':['years'],
 'years.read':['years'],
 'years.memberHistory':['years','members'],
 'families.list':['years','families'],
 'families.read':['years','families'],
 'families.candidates':['years','members','families'],
 'pastoral.list':['years','pastoral'],
 'pastoral.calendar':['years','pastoral'],
 'pastoral.contentLinks':['years','pastoral'],
 'records.workspace':['years','records'],
 'records.careHistory':['years','records'],
 'records.list':['years','members','records'],
 'records.attendanceHistory':['years','members','records'],
 'records.attendanceRoster':['years','members','organizations','records','attendance_sessions'],
};
export function directoryReadPlan(group:string|undefined,method:string){return plans[`${group??'root'}.${method}`];}
