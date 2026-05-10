// seedAdmin.ts
import bcrypt from 'bcryptjs'
import { eq, or } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../models/client'
import { User } from '../models/services/userService'
import { users } from '../schema/schema'

interface SeedAdminProps {
  phone: string
  password: string
  email?: string
  role?: 'admin' | 'customer' | 'manager'
}

export const seedAdmin = async ({
  phone,
  password,
  email,
  role = 'admin',
}: SeedAdminProps): Promise<User> => {
  // hash password
  const hashedPassword = await bcrypt.hash(password, 10)
  const normalizedEmail = email?.trim().toLowerCase() || null

  // check if user already exists
  const existing = await db
    .select()
    .from(users)
    .where(normalizedEmail ? or(eq(users.phone, phone), eq(users.email, normalizedEmail)) : eq(users.phone, phone))

  if (existing.length > 0) {
    const [current] = existing
    const [updated] = await db
      .update(users)
      .set({
        email: normalizedEmail ?? current.email ?? null,
        passwordHash: hashedPassword,
        role,
        phoneVerified: true,
        emailVerified: !!normalizedEmail,
        updatedAt: new Date(),
      })
      .where(eq(users.id, current.id))
      .returning()

    return updated as User
  }

  // insert new user
  const [newUser] = await db
    .insert(users)
    .values({
      id: uuidv4(),
      phone,
      email: normalizedEmail,
      passwordHash: hashedPassword,
      role,
      phoneVerified: true,
      emailVerified: !!normalizedEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  return newUser as User
}

seedAdmin({
  phone: '+916283315911', // valid Indian phone format
  email: 'admin@dolphinenterprises.in',
  password: 'Admin@12345!', // strong password
  role: 'admin',
})
  .then((user) => {
    console.log('Admin user created or already exists:', user)
    process.exit(0)
  })
  .catch((err) => {
    console.error('Error seeding admin:', err)
    process.exit(1)
  })
