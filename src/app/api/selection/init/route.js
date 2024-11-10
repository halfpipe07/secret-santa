import prisma from '@/lib/prisma';

export async function POST(request) {
  const { categories } = await request.json();

  try {
    await prisma.category.createMany({
      data: categories.map(category => ({
        id: category.id,
        title: category.title,
        subtitle: category.subtitle,
        selected: false,
      })),
      skipDuplicates: true,
    });
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}