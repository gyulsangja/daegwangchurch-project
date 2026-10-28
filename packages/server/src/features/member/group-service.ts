import { z } from 'zod';
import {groupIdSchema,groupInputSchema,groupNoticeInputSchema,groupMemberChanges} from '@daegwang/contracts/group-management';
export {groupInputSchema,groupNoticeInputSchema} from '@daegwang/contracts/group-management';
import type { PrismaClient,Prisma } from '@daegwang/database/generated/client';
import { groupPreferenceSchema, groupSnapshotSchema } from '@daegwang/contracts/features/member/groups';
import { MemberRecordConflict, MemberRecordNotFound } from './record-service';

type Db = Pick<PrismaClient, 'churchGroup' | 'groupMembership' | 'groupPreference' | 'groupNotice'>;
export function createGroupService(db: Db, verifiedOwner?: string, now = () => new Date()) {
  const ownerId = verifiedOwner ? z.uuid().parse(verifiedOwner) : undefined;
  async function snapshot() {
    const groups = await db.churchGroup.findMany({ where: { isActive: true }, select: { id: true, name: true, description: true }, orderBy: [{ name: 'asc' }, { id: 'asc' }] });
    const ids = groups.map(group => group.id);
    const memberships = ownerId ? (await db.groupMembership.findMany({ where: { ownerId, groupId: { in: ids } }, select: { groupId: true } })).map(row => row.groupId) : [];
    const preference = ownerId ? await db.groupPreference.findUnique({ where: { ownerId } }) : null;
    const notices = await db.groupNotice.findMany({ where: { groupId: { in: ids }, group: { isActive: true }, status: 'PUBLISHED', deletedAt: null, publishedAt: { lte: now() }, OR: [{ audience: 'PUBLIC' }, ...(ownerId ? [{ audience: 'MEMBERS', group: { memberships: { some: { ownerId } } } }] : [])] }, select: { id: true, groupId: true, title: true, body: true, audience: true, publishedAt: true }, orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }], take: 100 });
    return groupSnapshotSchema.parse({ groups, interests: (preference?.interests ?? []).filter(id => ids.includes(id)), memberships, notifications: preference?.notifications ?? false, version: preference?.version ?? 1, notices: notices.map(row => ({ ...row, publishedAt: row.publishedAt!.toISOString() })) });
  }
  return {
    snapshot,
    async update(input: unknown) {
      if (!ownerId) throw new MemberRecordNotFound();
      const value = groupPreferenceSchema.parse(input);
      const count = await db.churchGroup.count({ where: { id: { in: value.interests }, isActive: true } });
      if (count !== value.interests.length) throw new MemberRecordNotFound();
      await db.groupPreference.upsert({ where: { ownerId }, create: { ownerId }, update: {} });
      const saved = await db.groupPreference.updateMany({ where: { ownerId, version: value.version }, data: { interests: value.interests, notifications: value.notifications, version: { increment: 1 } } });
      if (!saved.count) throw new MemberRecordConflict();
      return snapshot();
    },
  };
}

export function createGroupAdminService(db: PrismaClient, adminId: string) {
  async function membershipChanges(tx: Prisma.TransactionClient, groupId: string, changes: {ownerId:string;approved:boolean;expectedMember?:boolean}[]) {
    if (!await tx.churchGroup.findFirst({where:{id:groupId,isActive:true}})) throw new MemberRecordNotFound();
    const owners=changes.map(c=>c.ownerId).sort();
    // Use the same owner locks as church approval and account deletion, in a stable order.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(owner_id, 0)) FROM (SELECT unnest(${owners}::text[]) AS owner_id ORDER BY owner_id) ordered_owners`;
    const [current,confirmed,deleting]=await Promise.all([
      tx.groupMembership.findMany({where:{groupId,ownerId:{in:owners}},select:{ownerId:true}}),
      tx.churchMembership.findMany({where:{ownerId:{in:owners},status:'CONFIRMED'},select:{ownerId:true}}),
      tx.memberDeletion.findMany({where:{ownerId:{in:owners}},select:{ownerId:true}}),
    ]);
    const members=new Set(current.map(c=>c.ownerId)),eligible=new Set(confirmed.map(c=>c.ownerId)),removed=new Set(deleting.map(c=>c.ownerId));
    for(const change of changes) {
      if(change.expectedMember!==undefined&&members.has(change.ownerId)!==change.expectedMember)throw new MemberRecordConflict();
      if(change.approved&&(!eligible.has(change.ownerId)||removed.has(change.ownerId)))throw new MemberRecordConflict();
    }
    const changed=changes.filter(c=>members.has(c.ownerId)!==c.approved);
    const additions=changed.filter(c=>c.approved).map(c=>({groupId,ownerId:c.ownerId,approvedBy:adminId}));
    if(additions.length)await tx.groupMembership.createMany({data:additions});
    const removals=changed.filter(c=>!c.approved).map(c=>c.ownerId);
    if(removals.length)await tx.groupMembership.deleteMany({where:{groupId,ownerId:{in:removals}}});
    if(changed.length){
      await tx.churchMembership.updateMany({where:{ownerId:{in:changed.map(c=>c.ownerId)}},data:{version:{increment:1}}});
      await tx.activityLog.create({data:{actorId:adminId,action:'UPDATE',entityType:'GroupMembership',entityId:groupId,summary:'모임 구성원 변경',changes:{added:additions.map(c=>c.ownerId),removed:removals}}});
    }
  }
  async function authorized(tx: Pick<PrismaClient, 'adminProfile' | 'groupManager'>, groupId?: string) {
    const admin = await tx.adminProfile.findFirst({ where: { id: adminId, isActive: true } });
    if (!admin) throw new Error('FORBIDDEN');
    if (admin.role !== 'SUPER_ADMIN' && (!groupId || !await tx.groupManager.findUnique({ where: { groupId_adminId: { groupId, adminId } } }))) throw new Error('FORBIDDEN');
    return admin;
  }
  return {
    async saveGroup(input: unknown) {
      const { version, ...value } = groupInputSchema.parse(input);
      return db.$transaction(async tx => {
        await authorized(tx);
        const existing = await tx.churchGroup.findUnique({ where: { id: value.id } });
        if (existing) {
          if (version === undefined) throw new MemberRecordConflict();
          const changed = await tx.churchGroup.updateMany({ where: { id: value.id, version }, data: { ...value, version: { increment: 1 } } });
          if (!changed.count) throw new MemberRecordConflict();
        } else {
          if (version !== undefined) throw new MemberRecordNotFound();
          await tx.churchGroup.create({ data: value });
        }
        const row = await tx.churchGroup.findUniqueOrThrow({ where: { id: value.id } });
        await tx.activityLog.create({ data: { actorId: adminId, action: 'UPDATE', entityType: 'ChurchGroup', entityId: row.id, summary: '모임 정보 변경' } });
        return row;
      });
    },
    async setMembership(groupId: string, owner: string, approved: boolean) {
      groupIdSchema.parse(groupId); const ownerId = z.uuid().parse(owner);
      return db.$transaction(async tx => {
        await authorized(tx, groupId);
        await membershipChanges(tx,groupId,[{ownerId,approved}]);
      });
    },
    async setMembershipBatch(groupId:string,input:unknown){groupIdSchema.parse(groupId);const changes=groupMemberChanges.parse(input);return db.$transaction(async tx=>{await authorized(tx);await membershipChanges(tx,groupId,changes);},{timeout:20000});},
    async setManager(groupId:string,target:string,assigned:boolean,expectedAssigned?:boolean){
      groupIdSchema.parse(groupId);z.string().min(1).max(100).parse(target);
      return db.$transaction(async tx=>{
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('admin-member-management', 0))`;
        await authorized(tx);
        if(!await tx.churchGroup.findUnique({where:{id:groupId}}))throw new MemberRecordNotFound();
        if(assigned&&!await tx.adminProfile.findFirst({where:{id:target,isActive:true}}))throw new MemberRecordNotFound();
        const old=await tx.groupManager.findUnique({where:{groupId_adminId:{groupId,adminId:target}}});
        if(expectedAssigned!==undefined&&!!old!==expectedAssigned)throw new MemberRecordConflict();
        if(assigned)await tx.groupManager.upsert({where:{groupId_adminId:{groupId,adminId:target}},create:{groupId,adminId:target},update:{}});
        else await tx.groupManager.deleteMany({where:{groupId,adminId:target}});
        await tx.activityLog.create({data:{actorId:adminId,action:'UPDATE',entityType:'GroupManager',entityId:groupId,summary:'모임 공지 담당자 변경',changes:{adminId:target,assigned}}});
      });
    },
    async deleteNotice(groupId:string,id:string,version:number){groupIdSchema.parse(groupId);z.number().int().positive().parse(version);return db.$transaction(async tx=>{await authorized(tx,groupId);const saved=await tx.groupNotice.updateMany({where:{id,groupId,version,deletedAt:null},data:{deletedAt:new Date(),version:{increment:1}}});if(!saved.count)throw new MemberRecordConflict();await tx.activityLog.create({data:{actorId:adminId,action:'DELETE',entityType:'GroupNotice',entityId:id,summary:'모임 공지 삭제'}});});},
    async saveNotice(input: unknown, id?: string, version?: number,createId?:string) {
      const value = groupNoticeInputSchema.parse(input);
      return db.$transaction(async tx => {
        await authorized(tx, value.groupId);
        if (!await tx.churchGroup.findFirst({ where: { id: value.groupId, isActive: true } })) throw new MemberRecordNotFound();
        let row;
        if (id) {
          z.number().int().positive().parse(version);
          const existing = await tx.groupNotice.findFirst({ where: { id, groupId: value.groupId, deletedAt: null } });
          if (!existing) throw new MemberRecordNotFound();
          const changed = await tx.groupNotice.updateMany({ where: { id, groupId: value.groupId, version,deletedAt:null }, data: { ...value, publishedAt: value.status === 'PUBLISHED' ? existing.publishedAt ?? new Date() : null, version: { increment: 1 } } });
          if (!changed.count) throw new MemberRecordConflict();
          row = await tx.groupNotice.findUniqueOrThrow({ where: { id } });
        } else {if(createId&&await tx.groupNotice.findUnique({where:{id:createId}}))throw new MemberRecordConflict();row = await tx.groupNotice.create({ data: { ...(createId?{id:createId}:{}),...value, publishedAt: value.status === 'PUBLISHED' ? new Date() : null } });}
        await tx.activityLog.create({ data: { actorId: adminId, action: id ? 'UPDATE' : 'CREATE', entityType: 'GroupNotice', entityId: row.id, summary: '모임 공지 저장', changes: { audience: value.audience, status: value.status } } });
        return row;
      });
    },
  };
}
