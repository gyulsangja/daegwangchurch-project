// In-flight GET coalescing only. Never retain private responses after completion.
// Each consumer owns its cancellation and receives a separate readable response.
type Flight={controller:AbortController;promise:Promise<Response>;consumers:number};
const flights=new Map<string,Flight>();
export function sharedRead(url:string,options:{signal?:AbortSignal;cache?:RequestCache}={}):Promise<Response>{
 if(!url.startsWith('/api/v1/'))throw Error('Only same-origin ministry reads may be shared');
 const signal=options.signal;
 if(signal?.aborted)return Promise.reject(new DOMException('Aborted','AbortError'));
 let flight=flights.get(url);
 if(!flight||flight.controller.signal.aborted){
  const controller=new AbortController();
  flight={controller,consumers:0,promise:fetch(url,{signal:controller.signal,cache:'no-store',credentials:'same-origin'})};
  const created=flight;flights.set(url,created);
  void created.promise.then(()=>{if(flights.get(url)===created)flights.delete(url);},()=>{if(flights.get(url)===created)flights.delete(url);});
 }
 const current=flight;current.consumers++;
 return new Promise((resolve,reject)=>{
  let done=false;
  const finish=()=>{if(done)return false;done=true;signal?.removeEventListener('abort',abort);current.consumers--;queueMicrotask(()=>{if(current.consumers===0&&flights.get(url)===current){current.controller.abort();flights.delete(url);}});return true;};
  const abort=()=>{if(finish())reject(new DOMException('Aborted','AbortError'));};
  signal?.addEventListener('abort',abort,{once:true});
  current.promise.then(response=>{if(finish())resolve(response.clone());},error=>{if(finish())reject(error);});
 });
}
