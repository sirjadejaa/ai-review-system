import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const isProduction =
    process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production';

  if (isProduction) {
    console.log('🔒 Production environment detected. Skipping all demo data seeding.');
    // Ensure singleton ShopSettings exists with clean, unpopulated fields
    await prisma.shopSettings.upsert({
      where: { id: 'default_shop' },
      update: {},
      create: {
        id: 'default_shop',
        shopName: 'Pharmacy',
        tagline: null,
        logoUrl: null,
        phoneNumber: null,
        whatsappNumber: null,
        address: null,
        googleMapsUrl: null,
        googleReviewUrl: null,
        openingHours: '[]',
        isEmergencyOpen: false,
      },
    });
    console.log('✅ Clean production singleton ShopSettings verified. No demo data inserted.');
    return;
  }

  console.log('🌱 Starting safe development database initialization...');

  // 1. Initialize or preserve Singleton ShopSettings
  const shouldSeedDemo = process.env.SEED_DEV_DEMO === 'true';

  await prisma.shopSettings.upsert({
    where: { id: 'default_shop' },
    update: {}, // Non-destructive: preserve any existing modified settings
    create: {
      id: 'default_shop',
      shopName: shouldSeedDemo ? 'City Care Pharmacy (Demo)' : 'Pharmacy',
      tagline: shouldSeedDemo ? 'Trusted Neighborhood Healthcare • Genuine Medicines' : null,
      logoUrl: null,
      phoneNumber: shouldSeedDemo ? '+91 98765 43210' : null,
      whatsappNumber: shouldSeedDemo ? '+91 98765 43210' : null,
      address: shouldSeedDemo ? 'Shop No. 4, Station Road, Opp. Hospital Gate' : null,
      googleMapsUrl: shouldSeedDemo ? 'https://maps.google.com/?q=Pharmacy' : null,
      googleReviewUrl: shouldSeedDemo ? 'https://g.page/r/example/review' : null,
      openingHours: shouldSeedDemo
        ? JSON.stringify([
            { days: 'Monday - Saturday', hours: '8:00 AM - 10:00 PM' },
            { days: 'Sunday', hours: '9:00 AM - 8:00 PM' },
          ])
        : '[]',
      isEmergencyOpen: false,
    },
  });
  console.log('✅ ShopSettings initialized.');

  // 2. Initialize development AdminUser if not exists
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { username: 'admin' },
  });

  if (!existingAdmin) {
    const adminUser = await prisma.adminUser.create({
      data: {
        username: 'admin',
        passwordHash: '$2b$10$AAvyhgGCSPSAmLin/PlzfudJKdcriXkifBQxEXGutIzEy/IQlvRSq', // Hash of 'admin123'
      },
    });
    console.log(`✅ Development AdminUser initialized: ${adminUser.username}`);
  } else {
    console.log(`ℹ️ AdminUser '${existingAdmin.username}' already exists. Preserved.`);
  }

  // 3. Demo Promotional Offers (ONLY when explicitly requested via SEED_DEV_DEMO=true)
  if (shouldSeedDemo) {
    const existingOfferCount = await prisma.offer.count();
    if (existingOfferCount === 0) {
      await prisma.offer.createMany({
        data: [
          {
            title: 'Senior Citizen Healthcare Discount',
            description: 'Flat 10% discount on regular healthcare essentials.',
            badge: 'SENIOR CARE',
            isActive: true,
            sortOrder: 1,
          },
          {
            title: 'Wellness & First-Aid Essentials',
            description: 'Special pricing on seasonal wellness products and first-aid kits.',
            badge: 'ESSENTIALS',
            isActive: true,
            sortOrder: 2,
          },
        ],
      });
      console.log('✅ Sample development store offers initialized.');
    }
  }

  console.log('✨ Seed process completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
