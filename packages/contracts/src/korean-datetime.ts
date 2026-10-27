// Church forms use Korea time regardless of the server's timezone.
export function koreanDateTimeInput(value:unknown){
 if(typeof value!=='string')return value;
 return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value)?`${value}+09:00`:value;
}
