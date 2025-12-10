import { pgTable, serial, varchar, boolean, timestamp, integer, text, uuid, unique, date, json } from "drizzle-orm/pg-core";
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
  is_admin: boolean("is_admin").default(false).notNull(),
});

// Buildings Table - Contains all campus building names
export const buildingsTable = pgTable("buildings", {
  id: serial("id").primaryKey(),
  buildingName: varchar("building_name", { length: 255 }).notNull().unique(),
  buildingAddress: varchar("building_address", { length: 500 }),
});

// Class Series Table - Recurring class template with consistent instructor and location
export const classSeriesTable = pgTable("class_series", {
  id: serial("id").primaryKey(),

  // Series identification
  seriesName: varchar("series_name", { length: 255 }).notNull(), // "Noontime Yoga", "Flow with Emma"
  seriesDescription: text("series_description").notNull(),

  // Recurrence pattern
  recurrencePattern: varchar("recurrence_pattern", { length: 20 }).notNull(), // 'weekly', 'bi-weekly', 'monthly'
  recurrenceDays: json("recurrence_days").$type<number[]>().notNull(), // [1] for Mon, [2,3,4,5] for Tue-Fri

  // Time (consistent across series)
  startTime: varchar("start_time", { length: 5 }).notNull(), // "12:00"
  endTime: varchar("end_time", { length: 5 }).notNull(), // "13:00"

  // Instructor - REQUIRED for all classes in the series
  instructorName: varchar("instructor_name", { length: 255 }).notNull(),

  // Location - building reference + room number
  buildingId: integer("building_id").references(() => buildingsTable.id).notNull(),
  roomNumber: varchar("room_number", { length: 50 }).notNull(),

  matsProvided: boolean("mats_provided").default(false).notNull(),

  // Series lifecycle
  seriesStartDate: date("series_start_date").notNull(),
  seriesEndDate: date("series_end_date"), // null for ongoing
  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Yoga Class Table - Individual class instances (can override series defaults)
export const yogaClassesTable = pgTable("yoga_classes", {
  id: serial("id").primaryKey(),

  // Link to series (null for one-time classes)
  seriesId: integer("series_id").references(() => classSeriesTable.id),

  // Instance details (uses series defaults if not overridden)
  className: varchar("class_name", { length: 255 }).notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  matsProvided: boolean("mats_provided").default(false).notNull(),
  classDescription: text("class_description").notNull(),
  isCancelled: boolean("is_cancelled").default(false).notNull(),

  // Instructor
  instructorName: varchar("instructor_name", { length: 255 }).notNull(),

  // Location - building reference + room number
  buildingId: integer("building_id").references(() => buildingsTable.id).notNull(),
  roomNumber: varchar("room_number", { length: 50 }).notNull(),

  currentEnrollment: integer("current_enrollment").notNull().default(0),
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
  series: many(classSeriesTable),
  classes: many(yogaClassesTable),
}));

export const classSeriesRelations = relations(classSeriesTable, ({ one, many }) => ({
  building: one(buildingsTable, {
    fields: [classSeriesTable.buildingId],
    references: [buildingsTable.id],
  }),
  classInstances: many(yogaClassesTable),
}));

export const yogaClassesRelations = relations(yogaClassesTable, ({ one, many }) => ({
  series: one(classSeriesTable, {
    fields: [yogaClassesTable.seriesId],
    references: [classSeriesTable.id],
  }),
  building: one(buildingsTable, {
    fields: [yogaClassesTable.buildingId],
    references: [buildingsTable.id],
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