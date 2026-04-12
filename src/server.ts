import { startServer } from "./app";
import { configureCloudinary } from "./config/cloudinary.config";
import { connectToDatabase, prisma } from "./config/db";
import { BookingStatus, PaymentMethod, PaymentStatus, UserRole, UserStatus } from "./generated/prisma/enums";
import { auth } from "./lib/auth";
import { faker } from '@faker-js/faker';

(async () => {
  await connectToDatabase();

  async function main() {
    console.log("🚀 Starting Seeding Process...");

    // 1. CLEAR DATA (Order: Children -> Parents)
    await prisma.payment.deleteMany();
    await prisma.review.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.tutorProfile.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.student.deleteMany();
    await prisma.admin.deleteMany(); // Clear admin too
    await prisma.category.deleteMany();
    await prisma.user.deleteMany(); // Better Auth User table

    // 2. SEED ADMIN
    console.log('Seeding Admin...');
    const adminAuth = await auth.api.signUpEmail({
      body: {
        email: "admin@tutorflow.com",
        password: "Password123!",
        name: "Super Admin",
      },
    });
    if (adminAuth) {
      await prisma.admin.create({
        data: {
          email: "admin@tutorflow.com",
          name: "Super Admin",
          contactNumber: "016847898",
          userId: adminAuth.user.id
        },
      });
    }

    // 3. SEED CATEGORIES
    console.log('Seeding Categories...');
    const categoryNames = ['Mathematics', 'Science', 'Languages', 'Programming', 'Business'];
    const createdCategories = await Promise.all(
      categoryNames.map((name) =>
        prisma.category.create({
          data: {
            name,
            subjects: [faker.commerce.productAdjective() + " " + name, "Advanced " + name],
          },
        })
      )
    );

    // 4. SEED 50 STUDENTS
    console.log('Seeding 50 Students...');
    const students = [];
    for (let i = 0; i < 50; i++) {
      const email = faker.internet.email();
      const authResult = await auth.api.signUpEmail({
        body: {
          email,
          password: 'Password123!',
          name: faker.person.fullName(),
        },
      });

      if (authResult) {
        const newStudent = await prisma.student.create({
          data: {
            name: authResult.user.name,
            email: authResult.user.email,
            role: UserRole.STUDENT,
            status: UserStatus.ACTIVE,
            profileAvatar: faker.image.avatar(),
            location: faker.location.city(),
            phoneNumber: faker.phone.number(),
            emailVerified: true,
            bio: faker.lorem.sentence(),
            password: "password123", // Matches your schema field
            userId: authResult.user.id
          },
        });
        students.push(newStudent);
      }
    }

    // 5. SEED 10 TUTORS
    console.log('Seeding 10 Tutors...');
    const tutors = [];
    for (let i = 0; i < 10; i++) {
      const category = faker.helpers.arrayElement(createdCategories);
      const tutorEmail = faker.internet.email();
      const tutorAuth = await auth.api.signUpEmail({
        body: {
          email: tutorEmail,
          password: 'Password123!',
          name: faker.person.fullName(),
        },
      });

      if (tutorAuth) {
        const tutorProfile = await prisma.tutorProfile.create({
          data: {
            userId: tutorAuth.user.id,
            name: tutorAuth.user.name,
            bio: faker.lorem.paragraph(),
            experience: '5+ years of teaching',
            hourlyRate: faker.number.int({ min: 30, max: 150 }),
            profileAvatar: faker.image.avatar(),
            category: category.name,
            categoryId: category.id,
            subjects: [category.name, faker.helpers.arrayElement(category.subjects)],
          },
        });
        tutors.push(tutorProfile);

        // Availability Slots
        for (let j = 0; j < 5; j++) {
          await prisma.availability.create({
            data: {
              tutorId: tutorProfile.id,
              date: faker.date.future(), // Passing full Date object fixes the error
              startTime: '10:00 AM',
              endTime: '11:00 AM',
              isBooked: false,
            },
          });
        }
      }
    }

    // 6. SEED BOOKINGS, PAYMENTS, REVIEWS
    console.log('Seeding Bookings, Payments, and Reviews...');
    for (let i = 0; i < 50; i++) {
      const student = faker.helpers.arrayElement(students);
      const tutor = faker.helpers.arrayElement(tutors);
      const availability = await prisma.availability.findFirst({
        where: { tutorId: tutor.id, isBooked: false },
      });

      if (availability) {
        const date = faker.date.between({ from: '2026-01-01', to: '2026-04-10' });
        
        const booking = await prisma.booking.create({
          data: {
            studentId: student.id,
            tutorId: tutor.id,
            availabilityId: availability.id,
            dateTime: date,
            status: BookingStatus.COMPLETED,
          },
        });

        await prisma.availability.update({
          where: { id: availability.id },
          data: { isBooked: true },
        });

        await prisma.payment.create({
          data: {
            bookingId: booking.id,
            userId: student.id,
            amount: tutor.hourlyRate,
            currency: 'USD',
            transactionId: `TXN-${faker.string.alphanumeric(8).toUpperCase()}`,
            paymentMethod: PaymentMethod.STRIPE,
            status: PaymentStatus.SUCCESS,
            createdAt: date,
          },
        });

        await prisma.review.create({
          data: {
            bookingId: booking.id,
            studentId: student.id,
            tutorId: tutor.id,
            rating: faker.number.int({ min: 4, max: 5 }),
            comment: faker.lorem.sentence(),
          },
        });
      }
    }

    console.log('✅ Seeding Complete!');
  }

  // EXECUTE
  try {
    // await main();
    await configureCloudinary();
    await startServer();
  } catch (error) {
    console.error("❌ Fatal Error during initialization:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();