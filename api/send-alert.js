module.exports = async function (req, res) {
  if (req.method !== 'POST' && req.method !== 'OPTIONS') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: 'Message body is required' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const toNumber = process.env.TWILIO_TO_NUMBER;

  if (!accountSid || !authToken || !fromNumber || !toNumber) {
    return res.status(500).json({ error: 'Twilio credentials are not fully configured in .env.local' });
  }

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  
  const formData = new URLSearchParams();
  formData.append('To', toNumber);
  formData.append('From', fromNumber);
  formData.append('Body', message);

  try {
    const twilioRes = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const data = await twilioRes.json();
    if (!twilioRes.ok) {
      console.error("Twilio API Error:", data);
      return res.status(twilioRes.status).json({ error: data.message || 'Failed to send SMS' });
    }

    return res.status(200).json({ success: true, messageId: data.sid });
  } catch (error) {
    console.error("Network Error:", error);
    return res.status(500).json({ error: 'Network error connecting to Twilio' });
  }
};
