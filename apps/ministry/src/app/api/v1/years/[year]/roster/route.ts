import { handle, readInput } from '@/lib/http';
export async function POST(request: Request, {params}:{params:Promise<{year:string}>}) {
  return handle(request, async(service,actor)=>service.years.roster(actor,Number((await params).year),await readInput(request)));
}
