
import prisma from '../../../lib/prisma';

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const { userEmail, dateTime, partySize, includesGuest } = req.body || {};
  if (!userEmail || !dateTime || !partySize) return res.status(400).json({error:'Missing fields'});
  const user = await prisma.user.findFirst({ where:{ email: userEmail } });
  if (!user) return res.status(404).json({error:'User not found. Apply for membership first.'});
  const reservation = await prisma.reservation.create({
    data: {
      userId: user.id,
      dateTime: new Date(dateTime),
      partySize: Number(partySize),
      includesGuest: !!includesGuest,
      totalAmount: Number(partySize) * 8000,
      status: 'pending'
    }
  });
  res.json({ ok:true, reservation });
}
