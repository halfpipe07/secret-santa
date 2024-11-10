import Pusher from 'pusher';
import sgMail from '@sendgrid/mail';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(request) {
  const body = await request.json();
  const { categoryId, code, categoryTitle, deviceId } = body;

  // Send real-time update to all clients
  await pusher.trigger('category-channel', 'category-selected', {
    categoryId,
    code
  });

  // Send notification email
  const msg = {
    to: process.env.NOTIFICATION_EMAIL,
    from: 'halfpipe07@yahoo.ca', // Replace with your verified SendGrid sender
    subject: 'New Category Selection',
    html: `
      <h2>New Category Selection</h2>
      <p>Category: <strong>${categoryTitle}</strong></p>
      <p>Code: <strong>${code}</strong></p>
      <p>Device ID: ${deviceId}</p>
      <p>Time: ${new Date().toLocaleString()}</p>
    `,
  };

  try {
    await sgMail.send(msg);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}