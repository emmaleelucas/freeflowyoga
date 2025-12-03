import { pgTable, serial, varchar, boolean, timestamp, integer, text, uuid, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// User Table - ID matches Supabase auth.users.id (UUID)
export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey(), // Matches Supabase auth.users.id
  kstateEmail: varchar("kstate_email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("student"), // 'student' or 'admin'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Buildings Table
export const buildingsTable = pgTable("buildings", {
  id: serial("id").primaryKey(),
  buildingName: varchar("building_name", { length: 255 }).notNull(),
  buildingAddress: varchar("building_address", { length: 500 }).notNull(),
});

// Rooms Table
export const roomsTable = pgTable("rooms", {
  id: serial("id").primaryKey(),
  roomName: varchar("room_name", { length: 100 }).notNull(),
  buildingId: integer("building_id").references(() => buildingsTable.id).notNull(),
});

// Yoga Class Table
export const yogaClassesTable = pgTable("yoga_classes", {
  id: serial("id").primaryKey(),
  className: varchar("class_name", { length: 255 }).notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  matsProvided: boolean("mats_provided").default(false).notNull(),
  classDescription: text("class_description").notNull(),
  isCancelled: boolean("is_cancelled").default(false).notNull(),
  instructorName: varchar("instructor_name", { length: 255 }).notNull(),
  currentEnrollment: integer("current_enrollment").notNull().default(0),
  roomId: integer("room_id").references(() => roomsTable.id).notNull(),
});

// ClassAttendance Table
export const classAttendanceTable = pgTable("class_attendance", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => usersTable.id).notNull(),
  classId: integer("class_id").references(() => yogaClassesTable.id).notNull(),
  registeredAt: timestamp("registered_at", { withTimezone: true }).defaultNow().notNull(),
  attended: boolean("attended").default(true).notNull(),
}, (table) => ({
  // Prevent duplicate registrations for the same user and class
  uniqueUserClass: unique().on(table.userId, table.classId),
}));

// Optional: Define relations for easier querying
export const usersRelations = relations(usersTable, ({ many }) => ({
  attendance: many(classAttendanceTable),
}));

export const buildingsRelations = relations(buildingsTable, ({ many }) => ({
  rooms: many(roomsTable),
}));

export const roomsRelations = relations(roomsTable, ({ one, many }) => ({
  building: one(buildingsTable, {
    fields: [roomsTable.buildingId],
    references: [buildingsTable.id],
  }),
  yogaClasses: many(yogaClassesTable),
}));

export const yogaClassesRelations = relations(yogaClassesTable, ({ one, many }) => ({
  room: one(roomsTable, {
    fields: [yogaClassesTable.roomId],
    references: [roomsTable.id],
  }),
  attendance: many(classAttendanceTable),
}));

export const classAttendanceRelations = relations(classAttendanceTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [classAttendanceTable.userId],
    references: [usersTable.id],
  }),
  class: one(yogaClassesTable, {
    fields: [classAttendanceTable.classId],
    references: [yogaClassesTable.id],
  }),
}));