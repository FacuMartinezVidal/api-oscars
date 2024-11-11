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
import { sql, eq, and, desc, or } from "drizzle-orm";
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

  updateMovie: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        year: z.number().optional(),
        synopsis: z.string().optional(),
        genre: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.sql.transaction(async (tx) => {
          // Update movie basic info
          const movieId = parseInt(input.id, 10);
          const updateData: any = {};
          if (input.title !== undefined) updateData.Title = input.title;
          if (input.year !== undefined) updateData.Year = input.year;
          if (input.synopsis !== undefined)
            updateData.Synopsis = input.synopsis;
          if (input.genre !== undefined) updateData.Genre = input.genre;

          const updatedMovie = await tx
            .update(MOVIE)
            .set(updateData)
            .where(eq(MOVIE.MovieID, movieId))
            .returning({
              MovieID: MOVIE.MovieID,
              Title: MOVIE.Title,
              Year: MOVIE.Year,
              Synopsis: MOVIE.Synopsis,
              Genre: MOVIE.Genre,
            });

          return updatedMovie[0];
        });
      } catch (error) {
        console.error("Error updating movie in SQL:", error);
        throw new Error("Failed to update movie");
      }
    }),

  insertMovie: publicProcedure
    .input(
      z.object({
        title: z.string(),
        year: z.number(),
        synopsis: z.string(),
        genre: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.sql.transaction(async (tx) => {
          // First, get the current maximum MovieID
          const maxIdResult = await tx
            .select({ maxId: sql<number>`MAX("MovieID")` })
            .from(MOVIE);

          const nextId = (maxIdResult[0]?.maxId || 0) + 1;

          // Reset the sequence
          await tx.execute(
            sql`SELECT setval('"MOVIE_MovieID_seq"', ${nextId}, false)`
          );

          const insertedMovie = await tx
            .insert(MOVIE)
            .values({
              Title: input.title,
              Year: input.year,
              Synopsis: input.synopsis,
              Genre: input.genre,
            })
            .returning({
              MovieID: MOVIE.MovieID,
              Title: MOVIE.Title,
              Year: MOVIE.Year,
              Synopsis: MOVIE.Synopsis,
              Genre: MOVIE.Genre,
            });

          return insertedMovie[0];
        });
      } catch (error) {
        console.error("Error inserting movie in SQL:", error);
        throw new Error("Failed to insert movie");
      }
    }),

  getAllMovies: publicProcedure.query(async ({ ctx }) => {
    return await ctx.sql.select().from(MOVIE);
  }),

  getAllProfessionals: publicProcedure.query(async ({ ctx }) => {
    try {
      const professionals = await ctx.sql
        .select({
          ProfessionalID: PROFESSIONAL.ProfessionalID,
          FirstName: PROFESSIONAL.FirstName,
          LastName: PROFESSIONAL.LastName,
          Nationality: PROFESSIONAL.Nationality,
          BirthDate: PROFESSIONAL.BirthDate,
        })
        .from(PROFESSIONAL);

      return professionals;
    } catch (error) {
      console.error("Error fetching professionals:", error);
      throw new Error("Failed to fetch professionals");
    }
  }),

  getAllAwards: publicProcedure.query(async ({ ctx }) => {
    return await ctx.sql.select().from(AWARD);
  }),

  getCategories: publicProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.sql.select().from(CATEGORY);
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw new Error("Failed to fetch categories");
    }
  }),

  getProfessionals: publicProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.sql.select().from(PROFESSIONAL);
    } catch (error) {
      console.error("Error fetching professionals:", error);
      throw new Error("Failed to fetch professionals");
    }
  }),

  deleteMovie: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.sql.transaction(async (tx) => {
          const movieId = parseInt(input.id, 10);

          // Primero eliminar registros relacionados
          await tx.delete(NOMINATION).where(eq(NOMINATION.MovieID, movieId));

          await tx
            .delete(PARTICIPATION)
            .where(eq(PARTICIPATION.MovieID, movieId));

          // Finalmente eliminar la película
          const deletedMovie = await tx
            .delete(MOVIE)
            .where(eq(MOVIE.MovieID, movieId))
            .returning({
              MovieID: MOVIE.MovieID,
              Title: MOVIE.Title,
              Year: MOVIE.Year,
              Synopsis: MOVIE.Synopsis,
              Genre: MOVIE.Genre,
            });

          return deletedMovie[0];
        });
      } catch (error) {
        console.error("Error deleting movie in SQL:", error);
        throw new Error("Failed to delete movie");
      }
    }),

  getAllNominations: publicProcedure.query(async ({ ctx }) => {
    try {
      const nominations = await ctx.sql
        .select({
          id: NOMINATION.NominationID,
          movieId: NOMINATION.MovieID,
          awardId: NOMINATION.AwardID,
          professionalId: NOMINATION.ProfessionalID,
          movieTitle: MOVIE.Title,
          categoryName: CATEGORY.CategoryName,
          result: AWARD.Result,
        })
        .from(NOMINATION)
        .leftJoin(MOVIE, eq(NOMINATION.MovieID, MOVIE.MovieID))
        .leftJoin(AWARD, eq(NOMINATION.AwardID, AWARD.AwardID))
        .leftJoin(BELONGS_TO, eq(AWARD.AwardID, BELONGS_TO.AwardID))
        .leftJoin(CATEGORY, eq(BELONGS_TO.CategoryID, CATEGORY.CategoryID));

      return nominations;
    } catch (error) {
      console.error("Error fetching nominations:", error);
      throw new Error("Failed to fetch nominations");
    }
  }),

  insertNomination: publicProcedure
    .input(
      z.object({
        movieId: z.string(),
        categoryId: z.string(),
        professionalId: z.string(),
        result: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.sql.transaction(async (tx) => {
          // First create the award
          const [award] = await tx
            .insert(AWARD)
            .values({
              Result: input.result,
            })
            .returning();

          // Link award to category
          await tx.insert(BELONGS_TO).values({
            AwardID: award.AwardID,
            CategoryID: parseInt(input.categoryId),
          });

          // Create the nomination
          const [nomination] = await tx
            .insert(NOMINATION)
            .values({
              MovieID: parseInt(input.movieId),
              AwardID: award.AwardID,
              ProfessionalID: parseInt(input.professionalId),
            })
            .returning();

          return {
            id: nomination.NominationID,
            movieId: nomination.MovieID,
            awardId: nomination.AwardID,
            professionalId: nomination.ProfessionalID,
          };
        });
      } catch (error) {
        console.error("Error inserting nomination:", error);
        throw new Error("Failed to insert nomination");
      }
    }),

  updateNomination: publicProcedure
    .input(
      z.object({
        id: z.string(),
        movieId: z.string().optional(),
        categoryId: z.string().optional(),
        professionalId: z.string().optional(),
        result: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.sql.transaction(async (tx) => {
          const nominationId = parseInt(input.id);

          // Get current nomination data
          const [currentNom] = await tx
            .select()
            .from(NOMINATION)
            .where(eq(NOMINATION.NominationID, nominationId));

          if (!currentNom) throw new Error("Nomination not found");

          // Update award result if provided
          if (input.result) {
            await tx
              .update(AWARD)
              .set({ Result: input.result })
              .where(eq(AWARD.AwardID, Number(currentNom.AwardID)));
          }

          // Update category if provided
          if (input.categoryId) {
            await tx
              .update(BELONGS_TO)
              .set({ CategoryID: parseInt(input.categoryId) })
              .where(eq(BELONGS_TO.AwardID, Number(currentNom.AwardID)));
          }

          // Update nomination
          const [updatedNom] = await tx
            .update(NOMINATION)
            .set({
              MovieID: input.movieId ? parseInt(input.movieId) : undefined,
              ProfessionalID: input.professionalId
                ? parseInt(input.professionalId)
                : undefined,
            })
            .where(eq(NOMINATION.NominationID, nominationId))
            .returning();

          return updatedNom;
        });
      } catch (error) {
        console.error("Error updating nomination:", error);
        throw new Error("Failed to update nomination");
      }
    }),

  deleteNomination: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.sql.transaction(async (tx) => {
          const nominationId = parseInt(input.id);

          // Get the nomination to find related award
          const [nomination] = await tx
            .select()
            .from(NOMINATION)
            .where(eq(NOMINATION.NominationID, nominationId));

          if (!nomination) throw new Error("Nomination not found");

          // Delete nomination
          await tx
            .delete(NOMINATION)
            .where(eq(NOMINATION.NominationID, Number(nominationId)));

          // Delete award relationships
          await tx
            .delete(BELONGS_TO)
            .where(eq(BELONGS_TO.AwardID, Number(nomination.AwardID)));

          // Delete award
          await tx
            .delete(AWARD)
            .where(eq(AWARD.AwardID, Number(nomination.AwardID)));

          return { success: true };
        });
      } catch (error) {
        console.error("Error deleting nomination:", error);
        throw new Error("Failed to delete nomination");
      }
    }),

  insertProfessional: publicProcedure
    .input(
      z.object({
        firstName: z.string(),
        lastName: z.string(),
        nationality: z.string(),
        birthDate: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.sql.transaction(async (tx) => {
          // Get the current maximum ProfessionalID
          const maxIdResult = await tx
            .select({ maxId: sql<number>`MAX("ProfessionalID")` })
            .from(PROFESSIONAL);

          const nextId = (maxIdResult[0]?.maxId || 0) + 1;

          // Reset the sequence
          await tx.execute(
            sql`SELECT setval('"PROFESSIONAL_ProfessionalID_seq"', ${nextId}, false)`
          );

          // Insert the professional
          const [professional] = await tx
            .insert(PROFESSIONAL)
            .values({
              FirstName: input.firstName,
              LastName: input.lastName,
              Nationality: input.nationality,
              BirthDate: input.birthDate,
            })
            .returning({
              ProfessionalID: PROFESSIONAL.ProfessionalID,
              FirstName: PROFESSIONAL.FirstName,
              LastName: PROFESSIONAL.LastName,
              Nationality: PROFESSIONAL.Nationality,
              BirthDate: PROFESSIONAL.BirthDate,
            });

          return professional;
        });
      } catch (error) {
        console.error("Error inserting professional:", error);
        throw new Error("Failed to insert professional");
      }
    }),

  updateProfessional: publicProcedure
    .input(
      z.object({
        professionalId: z
          .union([z.string(), z.number()])
          .transform((val) =>
            typeof val === "string" ? parseInt(val, 10) : val
          ),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        nationality: z.string().optional(),
        birthDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { professionalId, ...updateData } = input;
        const [professional] = await ctx.sql
          .update(PROFESSIONAL)
          .set({
            FirstName: updateData.firstName,
            LastName: updateData.lastName,
            Nationality: updateData.nationality,
            BirthDate: updateData.birthDate || undefined,
          })
          .where(eq(PROFESSIONAL.ProfessionalID, professionalId))
          .returning({
            ProfessionalID: PROFESSIONAL.ProfessionalID,
            FirstName: PROFESSIONAL.FirstName,
            LastName: PROFESSIONAL.LastName,
            Nationality: PROFESSIONAL.Nationality,
            BirthDate: PROFESSIONAL.BirthDate,
          });

        if (!professional) {
          throw new Error("Professional not found");
        }

        return professional;
      } catch (error) {
        console.error("Error updating professional:", error);
        throw new Error("Failed to update professional");
      }
    }),

  deleteProfessional: publicProcedure
    .input(
      z.object({
        professionalId: z
          .union([z.string(), z.number()])
          .transform((val) =>
            typeof val === "string" ? parseInt(val, 10) : val
          ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Using a transaction to handle related records
        return await ctx.sql.transaction(async (tx) => {
          // First delete related records
          await tx
            .delete(PARTICIPATION)
            .where(eq(PARTICIPATION.ProfessionalID, input.professionalId));

          await tx
            .delete(RECEIVES)
            .where(eq(RECEIVES.ProfessionalID, input.professionalId));

          await tx
            .delete(NOMINATION)
            .where(eq(NOMINATION.ProfessionalID, input.professionalId));

          // Then delete the professional
          const [deletedProfessional] = await tx
            .delete(PROFESSIONAL)
            .where(eq(PROFESSIONAL.ProfessionalID, input.professionalId))
            .returning({
              ProfessionalID: PROFESSIONAL.ProfessionalID,
              FirstName: PROFESSIONAL.FirstName,
              LastName: PROFESSIONAL.LastName,
            });

          if (!deletedProfessional) {
            throw new Error("Professional not found");
          }

          return deletedProfessional;
        });
      } catch (error) {
        console.error("Error deleting professional:", error);
        throw new Error("Failed to delete professional");
      }
    }),

  // Optional: Get professional with their nominations and awards
  getProfessionalDetails: publicProcedure
    .input(
      z.object({
        professionalId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const professional = await ctx.sql
          .select({
            ProfessionalID: PROFESSIONAL.ProfessionalID,
            FirstName: PROFESSIONAL.FirstName,
            LastName: PROFESSIONAL.LastName,
            Nationality: PROFESSIONAL.Nationality,
            BirthDate: PROFESSIONAL.BirthDate,
            AwardsCount: sql<number>`COUNT(DISTINCT ${RECEIVES.AwardID})`,
            NominationsCount: sql<number>`COUNT(DISTINCT ${NOMINATION.NominationID})`,
          })
          .from(PROFESSIONAL)
          .leftJoin(
            RECEIVES,
            eq(PROFESSIONAL.ProfessionalID, RECEIVES.ProfessionalID)
          )
          .leftJoin(
            NOMINATION,
            eq(PROFESSIONAL.ProfessionalID, NOMINATION.ProfessionalID)
          )
          .where(eq(PROFESSIONAL.ProfessionalID, input.professionalId))
          .groupBy(
            PROFESSIONAL.ProfessionalID,
            PROFESSIONAL.FirstName,
            PROFESSIONAL.LastName,
            PROFESSIONAL.Nationality,
            PROFESSIONAL.BirthDate
          );

        return professional[0];
      } catch (error) {
        console.error("Error fetching professional details:", error);
        throw new Error("Failed to fetch professional details");
      }
    }),
});
