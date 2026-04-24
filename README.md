# Edu Spark Backend ⚙️  
Scalable REST API for a Tutor–Student Marketplace

> Edu Spark Backend is a production-ready REST API that powers the SkillBridge learning platform.  
> It provides secure authentication, role-based authorization, tutor discovery, bookings, reviews, and admin moderation.

---

## 🔗 Live & Repository Links

- 📦 GitHub Repo: https://github.com/habiburRhaman05/EduSpark-modern-learning-platfrom 

---

## 📌 About This Repository

This repository contains **only the backend** of Edu Spark.

- ❌ No frontend UI
- ❌ No client routing
- ✅ RESTful API only
- ✅ Supports Web, Mobile & Admin clients

---

## 🎯 Core Goals

- Secure JWT authentication with HTTP-only cookies
- Role-based access control (Student, Tutor, Admin)
- Clean, scalable backend architecture
- Reliable booking & review workflows
- Production-ready deployment

---

## 🧑‍💼 User Roles

| Role | Description | Access |
|-----|-------------|--------|
| STUDENT | Book tutors & leave reviews | Limited |
| TUTOR | Manage profile & availability | Medium |
| ADMIN | Full platform control | Full |

> ⚠️ Admin accounts must be seeded manually.

---

## 🧱 Project Architecture

```
src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── tutors/
│   ├── bookings/
│   ├── reviews/
│   └── admin/
│
├── middlewares/
│   ├── auth.middleware.ts
│   ├── role.middleware.ts
│   └── error.middleware.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── app.ts
└── server.ts
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-----|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT + Cookies |
| Validation | Zod / Express Validator |
| Security | Helmet, CORS |
| Hosting | Railway |

---

## 🔐 Authentication & Security

- JWT based authentication
- HTTP-only secure cookies
- Role-based route protection
- Centralized error handling
- Cross-origin authentication support

---

## 📚 API Endpoints

### Auth
| Method | Endpoint | Description |
|------|---------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |

### Tutors (Public)
| Method | Endpoint | Description |
|------|---------|-------------|
| GET | /api/tutors | Tutor list |
| GET | /api/tutors/:id | Tutor details |
| GET | /api/categories | Categories |

### Bookings
| Method | Endpoint | Description |
|------|---------|-------------|
| POST | /api/bookings | Create booking |
| GET | /api/bookings | My bookings |
| GET | /api/bookings/:id | Booking details |

### Tutor
| Method | Endpoint | Description |
|------|---------|-------------|
| PUT | /api/tutor/profile | Update profile |
| PUT | /api/tutor/availability | Update availability |

### Reviews
| Method | Endpoint | Description |
|------|---------|-------------|
| POST | /api/reviews | Create review |

### Admin
| Method | Endpoint | Description |
|------|---------|-------------|
| GET | /api/admin/users | All users |
| PATCH | /api/admin/users/:id | Ban / Unban |

---

## 🗃 Database Models

- User
- TutorProfile
- Category
- Booking
- Review

---

## ⚙️ Environment Variables

Create a `.env` file:

```
PORT=5000
DATABASE_URL=postgresql://user:password@host:port/db
JWT_SECRET=your_super_secret_key
FRONTEND_URL=https://edu-spark-zone.vercel.app
NODE_ENV=production
```

---

## 🚀 Run Locally

```
git clone https://github.com/habiburRhaman05/EduSpark-modern-learning-platfrom.git
cd skill-bridge-backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

---

## 📈 Future Enhancements

- Payments integration
- Real-time chat (Socket.IO)
- Notification system
- Advanced admin analytics

---

## 👨‍💻 Author

Habibur Rahman  


