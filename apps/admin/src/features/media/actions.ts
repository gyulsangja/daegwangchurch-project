"use server";
import {revalidatePath} from '@/lib/revalidate';
import {redirect} from 'next/navigation';
import {getUnreferencedMediaWhere} from '@daegwang/server/features/media/queries';
import {cleanupMedia} from '@daegwang/server/features/media/cleanup';
import {getPrisma} from '@daegwang/database/prisma';
import {requireSuperAdmin} from '../../lib/auth/permissions';
import {createClient} from '../../lib/supabase/server';
export async function cleanupUnreferencedMediaAction(){
 const admin=await requireSuperAdmin(),supabase=await createClient();
 const result=await cleanupMedia(getPrisma(),getUnreferencedMediaWhere(),admin.id,async(bucket,paths)=>{const {error}=await supabase.storage.from(bucket).remove(paths);if(error)throw error;});
 revalidatePath('/admin/media');revalidatePath('/admin/dashboard');
 redirect(`/admin/media?cleaned=${result.count}&storageFailures=${result.storageFailures}`);
}
