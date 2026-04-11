import { prisma } from "./lib/prisma"; // Your prisma client path
import { auth } from "./lib/auth";     // Your better-auth instance path

async function seed() {
  console.log("🚀 Starting Better-Auth Seed...");

  // 1. Admin
  await auth.api.signUpEmail({
    body: {
      email: "admin@tutorflow.com",
      password: "password123",
      name: "Super Admin",
      role: "ADMIN",
    },
  });

//   // 2. Technicians (5)
//   const techNames = ["Arif", "Siam", "Jony", "Mitu", "Emon"];
//   for (const name of techNames) {
//     const user = await auth.api.signUpEmail({
//       body: {
//         email: `${name.toLowerCase()}@tech.com`,
//         password: "password123",
//         name: `${name} Tech`,
//         role: "admin", 
//       },
//     });

//     if (user) {
//       await prisma.technician.create({
//         data: {
//           name: `${name} Tech`,
//           email: `${name.toLowerCase()}@tech.com`,
//           loaction: "Dhaka",
//           userId: user.user.id, // Linking to Better-Auth generated ID
//         },
//       });
//     }
//   }

//   // 3. Students (10)
//   for (let i = 1; i <= 10; i++) {
//     await auth.api.signUpEmail({
//       body: {
//         email: `student${i}@gmail.com`,
//         password: "password123",
//         name: `Student ${i}`,
//         role: "student",
//       },
//     });
//   }

//   // 4. Tutors (10)
//   for (let i = 1; i <= 10; i++) {
//     const tutor = await auth.api.signUpEmail({
//       body: {
//         email: `tutor${i}@tutorflow.com`,
//         password: "password123",
//         name: `Tutor ${i}`,
//         role: "tutor",
//       },
//     });

//     if (tutor) {
//       await prisma.tutorProfile.create({
//         data: {
//           userId: tutor.user.id,
//           bio: "Expert Tutor",
//           hourlyRate: 500,
//           experience: "5 years",
//           name:"any-name",
//           profileAvatar:"",
//         categoryId:"",
// category:""
//         },
//       });
//     }
//   }

  console.log("✅ Seed Complete. You can now login with auth.api.signInEmail");
}

seed().catch(console.error);