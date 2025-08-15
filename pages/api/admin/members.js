
import prisma from '../../../lib/prisma';

export default async function handler(req, res){
  const key = req.query.key || '';
  if (key !== process.env.ADMIN_KEY) return res.status(401).json({error:'unauthorized'});
  const users = await prisma.user.findMany({ orderBy:{ createdAt:'desc' }, take: 100 });
  res.json({ users });
}
