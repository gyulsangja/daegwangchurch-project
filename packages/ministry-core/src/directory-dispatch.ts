// A proxy must not invent Promise/React/JSON methods (then, toJSON, $$typeof...).
export const directoryMethods={
 root:['snapshot','config','list','options','overview','detail','create','update'],
 years:['snapshot','roster','activeYear','syncMember','list','targets','read','memberHistory','create','configure','assign','activate'],
 records:['workspace','batch','snapshot','sessionSnapshot','careHistory','attendanceRoster','saveAttendance','attendanceHistory','correct','list','capture','add'],
 families:['link','list','candidates','read','create','update','archive'],
 pastoral:['snapshot','followUp','list','calendar','create','update'],
} as const;
export function directoryGroup(key:PropertyKey):key is Exclude<keyof typeof directoryMethods,'root'>{return typeof key==='string'&&key!=='root'&&Object.hasOwn(directoryMethods,key);}
export function directoryMethod(group:string|undefined,method:PropertyKey){const key=group??'root';return typeof method==='string'&&Object.hasOwn(directoryMethods,key)&&(directoryMethods[key as keyof typeof directoryMethods] as readonly string[]).includes(method);}
export function invokeDirectory(service:object,group:string|undefined,method:string,args:unknown[]){
 if(!directoryMethod(group,method))throw new Error('MINISTRY_UNKNOWN_METHOD');
 const target=group?Reflect.get(service,group):service;
 if(!target||typeof target!=='object')throw new Error('MINISTRY_UNKNOWN_METHOD');
 const action=Reflect.get(target,method);if(typeof action!=='function')throw new Error('MINISTRY_UNKNOWN_METHOD');
 return Reflect.apply(action,target,args);
}
