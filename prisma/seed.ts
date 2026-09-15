import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@codista.in";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe@123";
  const name = process.env.SEED_ADMIN_NAME ?? "Codista Admin";

  const passwordHash = await hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: Role.ADMIN, isActive: true },
    create: {
      email,
      name,
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const superEmail = "superadmin@codista.in";
  const superPassword = "Superadmin@123";
  const superPasswordHash = await hash(superPassword, 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: superEmail },
    update: {
      name: "Codista Super Admin",
      passwordHash: superPasswordHash,
      role: Role.ADMIN,
      isActive: true,
    },
    create: {
      email: superEmail,
      name: "Codista Super Admin",
      passwordHash: superPasswordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const hq = await prisma.branch.upsert({
    where: { id: "branch-hq" },
    update: {},
    create: {
      id: "branch-hq",
      name: "RS Puram / Gandhi Park",
      address: "RS Puram, Gandhi Park, Coimbatore",
      phone: "9994617222",
      isActive: true,
    },
  });

  await prisma.userBranch.upsert({
    where: { userId_branchId: { userId: admin.id, branchId: hq.id } },
    update: {},
    create: { userId: admin.id, branchId: hq.id },
  });

  await prisma.userBranch.upsert({
    where: { userId_branchId: { userId: superAdmin.id, branchId: hq.id } },
    update: {},
    create: { userId: superAdmin.id, branchId: hq.id },
  });

  const plans = [
    { name: "Daily", fee: 1500, sortOrder: 1 },
    { name: "4 days", fee: 1000, sortOrder: 2 },
    { name: "3 days", fee: 750, sortOrder: 3 },
    { name: "2 days", fee: 500, sortOrder: 4 },
  ];
  for (const p of plans) {
    await prisma.classPlan.upsert({
      where: { name: p.name },
      update: { fee: p.fee, sortOrder: p.sortOrder },
      create: p,
    });
  }

  await prisma.extraClass.upsert({
    where: { name: "Fitness" },
    update: { fee: 300 },
    create: { name: "Fitness", fee: 300, sortOrder: 1 },
  });

  const belts = [
    "10th Kup - White",
    "9th Kup - White with Yellow",
    "8th Kup - Yellow",
    "7th Kup - Yellow with Green",
    "6th Kup - Green",
    "5th Kup - Green with Blue",
    "4th Kup - Blue",
    "3rd Kup - Blue with Red",
    "2nd Kup - Red",
    "1st Kup - Red with Black",
    "1st Dan - Black",
    "2nd Dan - Black",
    "3rd Dan - Black",
  ];
  for (let i = 0; i < belts.length; i++) {
    await prisma.beltGrade.upsert({
      where: { name: belts[i] },
      update: { sortOrder: i + 1 },
      create: { name: belts[i], sortOrder: i + 1 },
    });
  }

  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  for (let i = 0; i < bloodGroups.length; i++) {
    await prisma.bloodGroup.upsert({
      where: { name: bloodGroups[i] },
      update: { sortOrder: i + 1, isActive: true },
      create: { name: bloodGroups[i], sortOrder: i + 1, isActive: true },
    });
  }

  const batches = ["Morning", "Evening", "Kids"];
  for (let i = 0; i < batches.length; i++) {
    await prisma.batch.upsert({
      where: { name_branchId: { name: batches[i], branchId: hq.id } },
      update: {},
      create: { name: batches[i], branchId: hq.id, sortOrder: i + 1 },
    });
  }

  await prisma.academySettings.upsert({
    where: { id: "default" },
    update: { monthlyFeeDay: 10 },
    create: {
      id: "default",
      joiningFee: 2000,
      joiningFeeSlabs: [
        { fromDay: 1, toDay: 10, percent: 100 },
        { fromDay: 11, toDay: 15, percent: 50 },
      ],
      membershipMonths: 1,
      monthlyFeeDay: 10,
      expiringSoonDays: 5,
      graceDays: 0,
      allowAttendanceWhenExpired: true,
      lateFineAmount: 0,
      receiptPrefix: "COD",
    },
  });

  for (const accountName of ["Cash", "UPI", "Bank"]) {
    await prisma.cashAccount.upsert({
      where: { name_branchId: { name: accountName, branchId: hq.id } },
      update: {},
      create: { name: accountName, branchId: hq.id },
    });
  }

  const leadership = [
    { name: "Dr. ISHARI K. GANESH", position: "President of Taekwondo Federation of India", sortOrder: 1 },
    { name: "Dr. P. SELVAMANI", position: "General Secretary of Tamilnadu Taekwondo Association", sortOrder: 2 },
    { name: "LAKSHMANA NARAYANAN", position: "President", sortOrder: 3 },
    { name: "V. ANANDHAN", position: "Vice President", sortOrder: 4 },
    { name: "Dr. G. RAGHAVAN", position: "Vice President", sortOrder: 5 },
    { name: "K.K. SIJU KUMAR", position: "Secretary / Head Coach", sortOrder: 6 },
    { name: "N. SURESHKANI", position: "Treasurer", sortOrder: 7 },
  ];
  const existingLeadership = await prisma.leadershipPerson.count();
  if (existingLeadership === 0) {
    await prisma.leadershipPerson.createMany({ data: leadership });
  }

  console.log(`Seeded admin ${email} / ${password}`);
  console.log(`Seeded admin ${superEmail} / ${superPassword}`);
  console.log(`HQ branch: ${hq.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
