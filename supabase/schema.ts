import {
  pgTable,
  serial,
  varchar,
  integer,
  text,
  date,
} from "drizzle-orm/pg-core";

export const MOVIE = pgTable("MOVIE", {
  MovieID: serial("MovieID").primaryKey(),
  Title: varchar("Title", { length: 100 }),
  Year: integer("Year"),
  Genre: varchar("Genre", { length: 50 }),
  Synopsis: text("Synopsis"),
});

export const CATEGORY = pgTable("CATEGORY", {
  CategoryID: serial("CategoryID").primaryKey(),
  CategoryName: varchar("CategoryName", { length: 50 }),
});

export const AWARD = pgTable("AWARD", {
  AwardID: serial("AwardID").primaryKey(),
  Result: varchar("Result", { length: 20 }),
});

export const NOMINATION = pgTable("NOMINATION", {
  NominationID: serial("NominationID").primaryKey(),
  MovieID: integer("MovieID"),
  AwardID: integer("AwardID"),
  ProfessionalID: integer("ProfessionalID"),
});

export const DELIVERY = pgTable("DELIVERY", {
  DeliveryID: serial("DeliveryID").primaryKey(),
  CeremonyID: integer("CeremonyID"),
  AwardID: integer("AwardID"),
});

export const CEREMONY = pgTable("CEREMONY", {
  CeremonyID: serial("CeremonyID").primaryKey(),
  Date: date("Date"),
  Location: varchar("Location", { length: 50 }),
});

export const PROFESSIONAL = pgTable("PROFESSIONAL", {
  ProfessionalID: serial("ProfessionalID").primaryKey(),
  FirstName: varchar("FirstName", { length: 50 }),
  LastName: varchar("LastName", { length: 50 }),
  Nationality: varchar("Nationality", { length: 50 }),
  BirthDate: date("BirthDate"),
});

export const PERFORMANCE = pgTable("PERFORMANCE", {
  PerformanceID: serial("PerformanceID").primaryKey(),
  CeremonyID: integer("CeremonyID"),
  MPerformanceID: integer("MPerformanceID"),
});

export const RECEIVES = pgTable("RECEIVES", {
  ReceivesID: serial("ReceivesID").primaryKey(),
  ProfessionalID: integer("ProfessionalID"),
  AwardID: integer("AwardID"),
});

export const PARTICIPATION = pgTable("PARTICIPATION", {
  ParticipationID: serial("ParticipationID").primaryKey(),
  ProfessionalID: integer("ProfessionalID"),
  MovieID: integer("MovieID"),
  Role: varchar("Role", { length: 50 }),
});

export const VOTING = pgTable("VOTING", {
  VotingID: serial("VotingID").primaryKey(),
  MemberID: integer("MemberID"),
  CeremonyID: integer("CeremonyID"),
  CategoryID: integer("CategoryID"),
});

export const MUSICAL_PERFORMANCE = pgTable("MUSICAL_PERFORMANCE", {
  PerformanceID: integer("PerformanceID"),
  Duration: integer("Duration"),
  MPresenationType: varchar("MPresenationType", { length: 50 }),
});

export const BELONGS_TO = pgTable("BELONGS_TO", {
  AwardID: integer("AwardID"),
  CategoryID: integer("CategoryID"),
});

export const ACADEMY_MEMBER = pgTable("ACADEMY_MEMBER", {
  MemberID: serial("MemberID").primaryKey(),
  Name: varchar("Name", { length: 50 }),
  Affiliation: varchar("Affiliation", { length: 50 }),
  Status: varchar("Status", { length: 20 }),
});
