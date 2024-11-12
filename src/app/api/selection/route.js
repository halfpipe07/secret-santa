import Pusher from 'pusher';
import prisma from '@/lib/prisma';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

export async function POST(request) {
  const body = await request.json();
  const { categoryId, code, categoryTitle, deviceId } = body;

  try {
    // Use a transaction with pessimistic locking to handle race conditions
    const result = await prisma.$transaction(async (prisma) => {
      // First, get the category with a lock
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { selected: true },
      });

      // Check if category is already selected
      if (category.selected) {
        return { success: false, error: 'Category already selected' };
      }

      // If not selected, update it
      await prisma.category.update({
        where: { id: categoryId },
        data: {
          selected: true,
          code: code,
          deviceId: deviceId
        }
      });

      return { success: true };
    }, {
      isolationLevel: 'Serializable' // This ensures complete isolation
    });

    if (!result.success) {
      return Response.json(result, { status: 409 }); // Conflict status code
    }

    // If successful, send real-time update via Pusher
    await pusher.trigger('category-channel', 'category-selected', {
      categoryId,
      code
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const categories = await prisma.category.findMany();
    return Response.json(categories);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}