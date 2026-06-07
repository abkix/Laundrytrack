export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { to, customerName, laundryName, trackUrl, type } = req.body;
  if (!to || !type) return res.status(400).json({ error: 'Missing required fields' });

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = 'whatsapp:+97466633779';

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  // Template SIDs
  const TEMPLATES = {
    order_received: {
      sid: 'HXeaa7b4ff7fdfd9ddc55182ad6fb6eda6',
      variables: { '1': customerName, '2': laundryName, '3': trackUrl }
    },
    order_ready: {
      sid: 'HX065734a8eb396cc44e985852aaea4d1f',
      variables: { '1': customerName, '2': `Order received at ${laundryName}` }
    }
  };

  const template = TEMPLATES[type];
  if (!template) return res.status(400).json({ error: 'Invalid template type' });

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: from,
        To: `whatsapp:${to}`,
        ContentSid: template.sid,
        ContentVariables: JSON.stringify(template.variables),
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(400).json({ error: data.message });
    return res.status(200).json({ success: true, sid: data.sid });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
