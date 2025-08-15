
import prisma from '../../../lib/prisma';

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const body = req.body || {};
  if (!body.fullName || !body.photoUrl) {
    return res.status(400).json({ error: 'Full name and photo URL are required.' });
  }
  const user = await prisma.user.create({
    data: {
      fullName: body.fullName,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      preferredContact: body.preferredContact || 'email',
      allergies: body.allergies || null,
      heardAbout: body.heardAbout || null,
      whyJoin: body.whyJoin || null,
      cannabisPreference: body.cannabisPreference || 'hybrid',
      photoUrl: body.photoUrl,
      membershipStatus: 'pending'
    }
  });
  res.json({ ok:true, user });
}
