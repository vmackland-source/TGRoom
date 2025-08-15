
import prisma from '../../../lib/prisma';

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const { email, items } = req.body || {};
  if (!email || !Array.isArray(items) || items.length===0) return res.status(400).json({error:'Missing fields'});
  const user = await prisma.user.findFirst({ where:{ email } });
  if (!user) return res.status(404).json({error:'User not found. Apply for membership first.'});
  const total = items.reduce((sum, it)=> sum + (it.price * it.qty) + ((it.infused && it.key!=='dessert') ? 500 * it.qty : 0), 0);
  const infused = items.some(i=>i.infused || i.key==='dessert');
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      itemsJson: JSON.stringify(items),
      totalAmount: total,
      infused,
      status: 'pending'
    }
  });
  res.json({ ok:true, order });
}
