import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

const categories = [
  {
    name: 'Home Services',
    slug: 'home-services',
    description: 'Cleaning, repairs, maintenance, and household help.',
    children: [
      { name: 'Cleaning', slug: 'cleaning' },
      { name: 'Plumbing', slug: 'plumbing' },
      { name: 'Electrical', slug: 'electrical' },
      { name: 'Gardening', slug: 'gardening' },
    ],
  },
  {
    name: 'Professional Services',
    slug: 'professional-services',
    description: 'Business, legal, accounting, and consulting work.',
    children: [
      { name: 'Accounting', slug: 'accounting' },
      { name: 'Legal', slug: 'legal' },
      { name: 'Consulting', slug: 'consulting' },
      { name: 'Marketing', slug: 'marketing' },
    ],
  },
  {
    name: 'Creative & Design',
    slug: 'creative-design',
    description: 'Graphic design, photography, video, and content creation.',
    children: [
      { name: 'Graphic Design', slug: 'graphic-design' },
      { name: 'Photography', slug: 'photography' },
      { name: 'Video Production', slug: 'video-production' },
      { name: 'Writing', slug: 'writing' },
    ],
  },
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Software development, IT support, and digital services.',
    children: [
      { name: 'Web Development', slug: 'web-development' },
      { name: 'Mobile Development', slug: 'mobile-development' },
      { name: 'IT Support', slug: 'it-support' },
      { name: 'Data Analysis', slug: 'data-analysis' },
    ],
  },
  {
    name: 'Events & Hospitality',
    slug: 'events-hospitality',
    description: 'Catering, event planning, and hospitality services.',
    children: [
      { name: 'Catering', slug: 'catering' },
      { name: 'Event Planning', slug: 'event-planning' },
      { name: 'Event Photography', slug: 'events-photography' },
    ],
  },
  {
    name: 'Transport & Delivery',
    slug: 'transport-delivery',
    description: 'Moving, courier, and delivery services.',
    children: [
      { name: 'Courier', slug: 'courier' },
      { name: 'Moving', slug: 'moving' },
      { name: 'Ride Services', slug: 'ride-services' },
    ],
  },
];

async function main() {
  for (const parent of categories) {
    const { children, ...parentData } = parent;
    const created = await prisma.serviceCategory.upsert({
      where: { slug: parentData.slug },
      update: { name: parentData.name, description: parentData.description },
      create: parentData,
    });

    for (const child of children) {
      await prisma.serviceCategory.upsert({
        where: { slug: child.slug },
        update: { name: child.name, parentId: created.id },
        create: { ...child, parentId: created.id },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
