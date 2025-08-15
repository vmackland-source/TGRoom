
import prisma from '../../../lib/prisma';

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const { email, cannabisPreference } = req.body || {};
  if (!email) return res.status(400).json({error:'Email required'});
  const user = await prisma.user.findFirst({ where:{ email } });
  if (!user) return res.status(404).json({error:'User not found. Apply for membership first.'});
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { cannabisPreference }
  });
  res.json({ ok:true, user: updated });
}
