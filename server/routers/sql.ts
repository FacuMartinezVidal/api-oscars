import {
  NOMINATION,
  AWARD,
  DELIVERY,
  CEREMONY,
  MOVIE,
  RECEIVES,
  VOTING,
  CATEGORY,
  BELONGS_TO,
  PROFESSIONAL,
  PARTICIPATION,
} from "@/supabase/schema";
import { publicProcedure, router } from "../trpc";
import { sql, eq, and, desc } from "drizzle-orm";
import { z } from "zod";

export const sqlRouter = router({
  //¿Cuántas películas han sido nominadas en diferentes categorías en los últimos n años?
  getMoviesNominatedLastFiveYears: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.sql
      .select()
      .from(NOMINATION)
      .innerJoin(AWARD, eq(NOMINATION.AwardID, AWARD.AwardID))
      .leftJoin(MOVIE, eq(NOMINATION.MovieID, MOVIE.MovieID));

    return result;
  }),

  //¿Qué películas han recibido más de 5 nominaciones Y han ganado al menos 3 premios?
  getMoviesNominatedAndAwardsWon: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.sql
      .select({
        MovieID: MOVIE.MovieID,
        Title: MOVIE.Title,
        TotalNominations: sql<number>`COUNT(${NOMINATION.AwardID})`,
        TotalAwards: sql<number>`COUNT(DISTINCT ${RECEIVES.AwardID})`,
      })
      .from(MOVIE)
      .innerJoin(NOMINATION, eq(MOVIE.MovieID, NOMINATION.MovieID))
      .innerJoin(AWARD, eq(AWARD.AwardID, NOMINATION.AwardID))
      .innerJoin(RECEIVES, eq(RECEIVES.AwardID, AWARD.AwardID))
      .groupBy(MOVIE.MovieID, MOVIE.Title)
      .having(
        and(
          sql`COUNT(${NOMINATION.AwardID}) > 5`,
          sql`COUNT(DISTINCT ${RECEIVES.AwardID}) >= 3`
        )
      );
    return result;
  }),
  getMoviesMostVotedAndLeastVoted: publicProcedure.query(async ({ ctx }) => {
    try {
      const mostVoted = await ctx.sql
        .select({
          Title: MOVIE.Title,
          Year: MOVIE.Year,
          TotalVotes: sql<number>`COUNT(${VOTING.VotingID})`,
        })
        .from(VOTING)
        .innerJoin(CATEGORY, eq(VOTING.CategoryID, CATEGORY.CategoryID))
        .innerJoin(BELONGS_TO, eq(BELONGS_TO.CategoryID, CATEGORY.CategoryID))
        .innerJoin(NOMINATION, eq(NOMINATION.AwardID, BELONGS_TO.AwardID))
        .innerJoin(MOVIE, eq(NOMINATION.MovieID, MOVIE.MovieID))
        .groupBy(MOVIE.MovieID, MOVIE.Title, MOVIE.Year)
        .orderBy(sql`COUNT(${VOTING.VotingID}) DESC`)
        .limit(1);

      const leastVoted = await ctx.sql
        .select({
          Title: MOVIE.Title,
          Year: MOVIE.Year,
          TotalVotes: sql<number>`COUNT(${VOTING.VotingID})`,
        })
        .from(VOTING)
        .innerJoin(CATEGORY, eq(VOTING.CategoryID, CATEGORY.CategoryID))
        .innerJoin(BELONGS_TO, eq(BELONGS_TO.CategoryID, CATEGORY.CategoryID))
        .innerJoin(NOMINATION, eq(NOMINATION.AwardID, BELONGS_TO.AwardID))
        .innerJoin(MOVIE, eq(NOMINATION.MovieID, MOVIE.MovieID))
        .groupBy(MOVIE.MovieID, MOVIE.Title, MOVIE.Year)
        .orderBy(sql`COUNT(${VOTING.VotingID}) ASC`)
        .limit(1);

      return { mostVoted, leastVoted };
    } catch (error) {
      console.error("Error in getMoviesMostVotedAndLeastVoted:", error);
      throw new Error("Failed to fetch most and least voted movies");
    }
  }),

  //¿Cuáles son los actores que han sido nominados más de 3 veces Y no han ganado nunca un premio?
  getActorsNominatedMoreThanThreeTimesAndNeverWonAnAward: publicProcedure.query(
    async ({ ctx }) => {
      const result = await ctx.sql
        .select({
          ProfessionalID: PROFESSIONAL.ProfessionalID,
          FirstName: PROFESSIONAL.FirstName,
          TotalNominations: sql<number>`COUNT(${NOMINATION.AwardID})`,
        })
        .from(PROFESSIONAL)
        .innerJoin(
          PARTICIPATION,
          eq(PROFESSIONAL.ProfessionalID, PARTICIPATION.ProfessionalID)
        )
        .innerJoin(NOMINATION, eq(PARTICIPATION.MovieID, NOMINATION.MovieID))
        .leftJoin(
          RECEIVES,
          eq(PROFESSIONAL.ProfessionalID, RECEIVES.ProfessionalID)
        )
        .where(eq(PARTICIPATION.Role, "Actor"))
        .groupBy(PROFESSIONAL.ProfessionalID, PROFESSIONAL.FirstName)
        .having(
          and(
            sql`COUNT(${NOMINATION.AwardID}) > 3`,
            sql`COUNT(${RECEIVES.AwardID}) = 0`
          )
        );
      return result;
    }
  ),

  //¿Cuántas películas han sido nominadas en diferentes categorías en los últimos 3 años?
  getMoviesNominatedInDifferentCategoriesLastThreeYears: publicProcedure.query(
    async ({ ctx }) => {
      try {
        const result = await ctx.sql
          .select({
            MovieID: MOVIE.MovieID,
            Title: MOVIE.Title,
            Year: MOVIE.Year,
            Synopsis: MOVIE.Synopsis,
            CategoryName: CATEGORY.CategoryName,
          })
          .from(MOVIE)
          .innerJoin(NOMINATION, eq(MOVIE.MovieID, NOMINATION.MovieID))
          .innerJoin(BELONGS_TO, eq(NOMINATION.AwardID, BELONGS_TO.AwardID))
          .innerJoin(CATEGORY, eq(BELONGS_TO.CategoryID, CATEGORY.CategoryID))
          .groupBy(
            MOVIE.MovieID,
            MOVIE.Title,
            MOVIE.Year,
            MOVIE.Synopsis,
            CATEGORY.CategoryName
          );

        console.log("SQL Query Result:", result); // Debug log
        return result;
      } catch (error) {
        console.error("SQL Query Error:", error);
        throw error;
      }
    }
  ),

  //¿Cuántas nominaciones ha recibido un director específico en su carrera?
  getNominationsByDirector: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.sql
      .select({
        MovieTitle: MOVIE.Title,
        NominationYear: MOVIE.Year,
        Category: CATEGORY.CategoryName,
        TotalNominations: sql<number>`COUNT(${NOMINATION.AwardID})`,
      })
      .from(NOMINATION)
      .innerJoin(MOVIE, eq(NOMINATION.MovieID, MOVIE.MovieID))
      .innerJoin(
        PARTICIPATION,
        eq(NOMINATION.ProfessionalID, PARTICIPATION.ProfessionalID)
      )
      .innerJoin(BELONGS_TO, eq(NOMINATION.AwardID, BELONGS_TO.AwardID))
      .innerJoin(CATEGORY, eq(BELONGS_TO.CategoryID, CATEGORY.CategoryID))
      .where(
        and(
          eq(PARTICIPATION.Role, "Director"),
          eq(NOMINATION.ProfessionalID, 3)
        )
      )
      .groupBy(MOVIE.Title, MOVIE.Year, CATEGORY.CategoryName)
      .orderBy(desc(MOVIE.Year));
    return result;
  }),

  getDirectorNominationsByName: publicProcedure
    .input(z.object({ searchTerm: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.sql
        .select({
          director: sql<string>`${PROFESSIONAL.FirstName} || ' ' || ${PROFESSIONAL.LastName}`,
          nominationsCount: sql<number>`COUNT(DISTINCT ${NOMINATION.NominationID})`,
          nominations: sql<any[]>`
            json_agg(
              json_build_object(
                'movie', ${MOVIE.Title},
                'year', ${MOVIE.Year},
                'category', ${CATEGORY.CategoryName},
                'result', ${AWARD.Result}
              )
            )`,
        })
        .from(PROFESSIONAL)
        .innerJoin(
          PARTICIPATION,
          and(
            eq(PROFESSIONAL.ProfessionalID, PARTICIPATION.ProfessionalID),
            eq(PARTICIPATION.Role, "Director")
          )
        )
        .innerJoin(MOVIE, eq(PARTICIPATION.MovieID, MOVIE.MovieID))
        .innerJoin(NOMINATION, eq(MOVIE.MovieID, NOMINATION.MovieID))
        .innerJoin(AWARD, eq(NOMINATION.AwardID, AWARD.AwardID))
        .innerJoin(BELONGS_TO, eq(AWARD.AwardID, BELONGS_TO.AwardID))
        .innerJoin(CATEGORY, eq(BELONGS_TO.CategoryID, CATEGORY.CategoryID))
        .where(
          sql`LOWER(${PROFESSIONAL.FirstName} || ' ' || ${
            PROFESSIONAL.LastName
          }) LIKE LOWER(${"%" + input.searchTerm + "%"})`
        )
        .groupBy(PROFESSIONAL.ProfessionalID)
        .orderBy(desc(sql<number>`COUNT(DISTINCT ${NOMINATION.NominationID})`));
      return result;
    }),

  //¿Cuáles son las películas más premiadas en la historia de los Oscars y cuantos premios tiene?
  getMostAwardedMovies: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.sql
      .select({
        MovieID: MOVIE.MovieID,
        Title: MOVIE.Title,
        Year: MOVIE.Year,
        Synopsis: MOVIE.Synopsis,
        TotalAwards: sql<number>`COUNT(${RECEIVES.AwardID})`,
        Categories: sql<string>`string_agg(DISTINCT ${CATEGORY.CategoryName}, ', ')`,
      })
      .from(MOVIE)
      .innerJoin(NOMINATION, eq(MOVIE.MovieID, NOMINATION.MovieID))
      .innerJoin(AWARD, eq(NOMINATION.AwardID, AWARD.AwardID))
      .innerJoin(RECEIVES, eq(AWARD.AwardID, RECEIVES.AwardID))
      .innerJoin(BELONGS_TO, eq(AWARD.AwardID, BELONGS_TO.AwardID))
      .innerJoin(CATEGORY, eq(BELONGS_TO.CategoryID, CATEGORY.CategoryID))
      .groupBy(MOVIE.MovieID, MOVIE.Title, MOVIE.Year, MOVIE.Synopsis)
      .orderBy(desc(sql<number>`COUNT(${RECEIVES.AwardID})`))
      .limit(10);

    return result;
  }),

  // ¿Cuáles son los actores más premiados y en qué películas han ganado premios?
  getMostAwardedActors: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.sql
      .select({
        ProfessionalID: PROFESSIONAL.ProfessionalID,
        FirstName: PROFESSIONAL.FirstName,
        LastName: PROFESSIONAL.LastName,
        BirthDate: PROFESSIONAL.BirthDate,
        MovieTitle: MOVIE.Title,
        MovieYear: MOVIE.Year,
        TotalAwards: sql<number>`COUNT(${RECEIVES.AwardID})`,
      })
      .from(PROFESSIONAL)
      .innerJoin(
        RECEIVES,
        eq(PROFESSIONAL.ProfessionalID, RECEIVES.ProfessionalID)
      )
      .innerJoin(
        PARTICIPATION,
        eq(PROFESSIONAL.ProfessionalID, PARTICIPATION.ProfessionalID)
      )
      .innerJoin(MOVIE, eq(PARTICIPATION.MovieID, MOVIE.MovieID))
      .where(eq(PARTICIPATION.Role, "Actor"))
      .groupBy(
        PROFESSIONAL.ProfessionalID,
        PROFESSIONAL.FirstName,
        PROFESSIONAL.LastName,
        PROFESSIONAL.BirthDate,
        MOVIE.Title,
        MOVIE.Year
      )
      .orderBy(
        desc(sql<number>`COUNT(${RECEIVES.AwardID})`),
        PROFESSIONAL.FirstName,
        PROFESSIONAL.LastName
      )
      .limit(10);

    return result;
  }),

  getMostAwardedActorWithNominations: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.sql
      .select({
        firstName: PROFESSIONAL.FirstName,
        lastName: PROFESSIONAL.LastName,
        dateOfBirth: PROFESSIONAL.BirthDate,
        awardsWon: sql<number>`COUNT(DISTINCT ${RECEIVES.AwardID})`,
        nominations: sql<any[]>`
          json_agg(
            json_build_object(
              'category', ${CATEGORY.CategoryName},
              'year', ${MOVIE.Year},
              'movie', ${MOVIE.Title},
              'awardId', ${AWARD.AwardID},
              'result', ${AWARD.Result}
            )
          )`,
      })
      .from(PROFESSIONAL)
      .innerJoin(
        PARTICIPATION,
        and(
          eq(PROFESSIONAL.ProfessionalID, PARTICIPATION.ProfessionalID),
          eq(PARTICIPATION.Role, "Actor")
        )
      )
      .innerJoin(MOVIE, eq(PARTICIPATION.MovieID, MOVIE.MovieID))
      .innerJoin(NOMINATION, eq(MOVIE.MovieID, NOMINATION.MovieID))
      .innerJoin(AWARD, eq(NOMINATION.AwardID, AWARD.AwardID))
      .innerJoin(BELONGS_TO, eq(AWARD.AwardID, BELONGS_TO.AwardID))
      .innerJoin(CATEGORY, eq(BELONGS_TO.CategoryID, CATEGORY.CategoryID))
      .leftJoin(RECEIVES, eq(AWARD.AwardID, RECEIVES.AwardID))
      .groupBy(PROFESSIONAL.ProfessionalID)
      .orderBy(desc(sql<number>`COUNT(DISTINCT ${RECEIVES.AwardID})`))
      .limit(1);

    return result[0];
  }),
});
