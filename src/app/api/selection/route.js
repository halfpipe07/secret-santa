import Pusher from 'pusher';
import sgMail from '@sendgrid/mail';
import prisma from '@/lib/prisma';

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

  try {
    // Update database
    await prisma.category.update({
      where: { id: categoryId },
      data: {
        selected: true,
        code: code,
        deviceId: deviceId
      }
    });

    // Send real-time update
    await pusher.trigger('category-channel', 'category-selected', {
      categoryId,
      code
    });

    // Send email
    const msg = {
      to: process.env.NOTIFICATION_EMAIL,
      from: 'your-verified-sender@yourdomain.com',
      subject: 'New Category Selection',
      html: `
        <h2>New Category Selection</h2>
        <p>Category: <strong>${categoryTitle}</strong></p>
        <p>Code: <strong>${code}</strong></p>
        <p>Device ID: ${deviceId}</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `,
    };

    await sgMail.send(msg);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Add GET endpoint to fetch initial state
export async function GET() {
  try {
    const categories = await prisma.category.findMany();
    return Response.json(categories);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}