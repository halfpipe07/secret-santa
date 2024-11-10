const { PrismaClient } = require('./node_modules/.prisma/client');
const prisma = new PrismaClient()

const categories = [
  { "id": 1, "title": "Something to add to your latest 'budol'", "subtitle": "Impulse items like quirky mini perfumes or stylish little luxuries" },
  { "id": 2, "title": "Perfect for Saturdays", "subtitle": "Mga gamit para sa \"Walang kapaguran\" moments, from cozy blankets, self-care items to hobby starter packs" },
  { "id": 3, "title": "Something every tito/tita would carry", "subtitle": "Items that are handy for travel, like travel kits, band-aids, essential oils, or a mini sewing kit" },
  { "id": 4, "title": "Balik-alindog pero di pa ngayon", "subtitle": "Health-related gifts like water bottles, fitness journals, or stretching bands" },
  { "id": 5, "title": "Something na hindi obvious pero i will appreciate 10 years from now", "subtitle": "Thoughtful keepsakes, like items that gain value with time" },
  { "id": 6, "title": "Sikat nung 90's", "subtitle": "Throwback treasures like Tamagotchi, pogs, or plastic balloon na magpapa-nostalgic sa 'yo" },
  { "id": 7, "title": "Something to share with friends and family", "subtitle": "Bonding essentials like board games, party favors, o kaya yung mga picture frames na puno ng memories" },
  { "id": 8, "title": "Pang-beast mode sa work", "subtitle": "Items for productivity, like a desktop toy, mini whiteboard or quirky office supplies" },
  { "id": 9, "title": "Pang-reset ng good vibes", "subtitle": "Books, fresh-start journals or motivational planners, meditation apps are great here" },
  { "id": 10, "title": "Something out of this world", "subtitle": "Mga items na mapapasabi ka ng \"Saan mo 'to nakita?!\"" }
]

async function main() {
  console.log('Start seeding...')
  
  for (const category of categories) {
    const result = await prisma.category.upsert({
      where: { id: category.id },
      update: {},
      create: category,
    })
    console.log(`Created category with id: ${result.id}`)
  }
  
  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })