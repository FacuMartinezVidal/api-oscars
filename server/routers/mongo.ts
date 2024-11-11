import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { MOVIE } from "@/supabase/schema";
import { ObjectId } from "mongodb";

export const mongoRouter = router({
  //¿Cuántas películas han sido nominadas en diferentes categorías en los últimos n años?
  getMoviesNominated: publicProcedure.query(async ({ ctx, input }) => {
    try {
      const movies = await ctx.prisma.movies.findMany({
        where: {
          nominations: {
            isEmpty: false,
          },
        },
        orderBy: {
          year: "desc",
        },
        take: 3,
      });
      return movies.filter((movie) => movie.nominations.length > 0);
    } catch (error) {
      console.error(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener las películas nominadas",
      });
    }
  }),
  //¿Qué películas han recibido más de 5 nominaciones Y han ganado al menos 3 premios?
  getMoviesNominatedAndAwardsWon: publicProcedure.query(async ({ ctx }) => {
    try {
      const movies = await ctx.prisma.movies.findMany({
        where: {
          awardsWon: {
            gte: 3,
          },
        },
      });
      return movies.filter((movie) => movie.nominations.length > 4);
    } catch (error) {
      console.error(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener las películas nominadas y premiadas",
      });
    }
  }),

  // ¿Cuáles son las películas más premiadas en la historia de los Oscars y cuantos premios tiene?
  getMostAwardedMovies: publicProcedure.query(async ({ ctx }) => {
    try {
      const movies = await ctx.prisma.movies.findMany({
        orderBy: {
          awardsWon: "desc",
        },
        take: 3, // Obtener las 3 películas más premiadas
      });
      return movies;
    } catch (error) {
      console.error(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener las películas más premiadas",
      });
    }
  }),

  // ¿Cuáles son los actores que han sido nominados más de 3 veces Y no han ganando nunca un premio?
  getMostNominatedNonWinningActors: publicProcedure.query(async ({ ctx }) => {
    try {
      // First get all professionals with 0 awards won
      const actors = await ctx.prisma.professionals.findMany({
        where: {
          awardsWon: 0,
        },
      });

      // Double check nominations length in case Prisma query wasn't enough
      return actors.filter((actor) => actor.nominations.length > 3);
    } catch (error) {
      console.error(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener los actores más nominados sin premios",
      });
    }
  }),

  // ¿Qué actor tiene más premios a lo largo de su carrera?
  getMostAwardedActor: publicProcedure.query(async ({ ctx }) => {
    try {
      const mostAwardedActor = await ctx.prisma.professionals.findFirst({
        orderBy: {
          awardsWon: "desc",
        },
        take: 1,
      });

      if (!mostAwardedActor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No se encontraron actores con premios",
        });
      }

      return mostAwardedActor;
    } catch (error) {
      console.error(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener el actor más premiado",
      });
    }
  }),

  // ¿Cual ha sido la pelicula mas votada?
  getMostVotedMovie: publicProcedure.query(async ({ ctx }) => {
    try {
      const voteSummary = await ctx.prisma.votes.groupBy({
        by: ["movie"],
        _sum: {
          votes: true,
        },
        orderBy: {
          _sum: {
            votes: "desc",
          },
        },
      });

      if (voteSummary.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No se encontraron películas con votos",
        });
      }

      const mostVoted = voteSummary[0];
      const leastVoted = voteSummary[voteSummary.length - 1];

      return {
        mostVoted: {
          movie: mostVoted.movie,
          votes: mostVoted._sum.votes,
        },
        leastVoted: {
          movie: leastVoted.movie,
          votes: leastVoted._sum.votes,
        },
      };
    } catch (error) {
      console.error(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener las películas más y menos votadas",
      });
    }
  }),

  // ¿Cuántas nominaciones ha recibido un director específico en su carrera?
  getDirectorNominations: publicProcedure
    .input(
      z.object({
        searchTerm: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { searchTerm } = input;

        if (!searchTerm) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Se debe proporcionar un término de bsqueda",
          });
        }

        // Split the search term into words
        const searchWords = searchTerm.toLowerCase().split(/\s+/);

        const directors = await ctx.prisma.professionals.findMany({
          where: {
            AND: searchWords.map((word) => ({
              OR: [
                { firstName: { contains: word, mode: "insensitive" as const } },
                { lastName: { contains: word, mode: "insensitive" as const } },
              ],
            })),
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nominations: true,
          },
        });

        if (directors.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No se encontraron directores con ese nombre",
          });
        }

        return directors.map((director) => ({
          id: director.id,
          director: `${director.firstName} ${director.lastName}`,
          nominationsCount: director.nominations.length,
          nominations: director.nominations,
        }));
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al obtener las nominaciones del director",
        });
      }
    }),

  // updateMovie: publicProcedure
  //   .input(
  //     z.object({
  //       id: z.string(),
  //       title: z.string().optional(),
  //       year: z.number().optional(),
  //       synopsis: z.string().optional(),
  //       nominations: z
  //         .array(
  //           z.object({
  //             categoryId: z.string(),
  //             result: z.string(),
  //             year: z.number(),
  //           })
  //         )
  //         .optional(),
  //     })
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     try {
  //       const updatedMovie = await ctx.prisma.movies.update({
  //         where: {
  //           id: input.id, // Keep as string, don't parse to number
  //         },
  //         data: {
  //           title: input.title,
  //           year: input.year,
  //           synopsis: input.synopsis,
  //           nominations: input.nominations,
  //         },
  //       });
  //       return updatedMovie;
  //     } catch (error) {
  //       console.error("Update error:", error);
  //       throw new TRPCError({
  //         code: "INTERNAL_SERVER_ERROR",
  //         message: "Error updating movie: " + (error as Error).message,
  //       });
  //     }
  //   }),

  // insertMovie: publicProcedure
  //   .input(
  //     z.object({
  //       title: z.string(),
  //       year: z.number(),
  //       synopsis: z.string(),
  //       genre: z.string(),
  //       nominations: z.array(
  //         z.object({
  //           categoryId: z.string(),
  //           result: z.string(),
  //           year: z.number(),
  //         })
  //       ),
  //     })
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     try {
  //       const newMovie = await ctx.prisma.movies.create({
  //         data: {
  //           id: String(Date.now()), // Simple ID generation
  //           title: input.title,
  //           year: input.year,
  //           synopsis: input.synopsis,
  //           genre: input.genre,
  //           nominations: input.nominations,
  //           awardsWon: 0,
  //         },
  //       });
  //       return newMovie;
  //     } catch (error) {
  //       console.error("Insert error:", error);
  //       throw new TRPCError({
  //         code: "INTERNAL_SERVER_ERROR",
  //         message: "Error inserting movie: " + (error as Error).message,
  //       });
  //     }
  //   }),

  getMovies: publicProcedure.query(async ({ ctx }) => {
    try {
      const movies = await ctx.prisma.movies.findMany({
        orderBy: {
          year: "desc",
        },
      });
      return movies;
    } catch (error) {
      console.error("Error fetching movies:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch movies",
      });
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
        const movie = await ctx.prisma.movies.create({
          data: {
            id: String(Date.now()),
            title: input.title,
            year: input.year,
            synopsis: input.synopsis,
            genre: input.genre,
            awardsWon: 0,
          },
        });
        return movie;
      } catch (error) {
        console.error("Error creating movie:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create movie",
        });
      }
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
        const { id, ...updateData } = input;
        const movie = await ctx.prisma.movies.update({
          where: { id },
          data: updateData,
        });
        return movie;
      } catch (error) {
        console.error("Error updating movie:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update movie",
        });
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
        await ctx.prisma.movies.delete({
          where: { id: input.id },
        });
        return { success: true };
      } catch (error) {
        console.error("Error deleting movie:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete movie",
        });
      }
    }),

  getNominations: publicProcedure.query(async ({ ctx }) => {
    try {
      const movies = await ctx.prisma.movies.findMany({
        select: {
          id: true,
          title: true,
          year: true,
          nominations: true,
        },
      });

      // Transformar los datos para mantener el formato consistente
      return movies.flatMap((movie) =>
        movie.nominations.map((nom) => ({
          id: `${movie.id}_${nom.categoryId}_${nom.year}`,
          movieTitle: movie.title,
          movieId: movie.id,
          categoryId: nom.categoryId,
          year: nom.year,
          result: nom.result,
        }))
      );
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
        year: z.number(),
        result: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const updatedMovie = await ctx.prisma.movies.update({
          where: { id: input.movieId },
          data: {
            nominations: {
              push: {
                categoryId: input.categoryId,
                year: input.year,
                result: input.result,
              },
            },
          },
        });

        return {
          id: `${input.movieId}_${input.categoryId}_${input.year}`,
          movieId: input.movieId,
          categoryId: input.categoryId,
          year: input.year,
          result: input.result,
        };
      } catch (error) {
        console.error("Error creating nomination:", error);
        throw new Error("Failed to create nomination");
      }
    }),

  updateNomination: publicProcedure
    .input(
      z.object({
        id: z.string(),
        movieId: z.string().optional(),
        categoryId: z.string().optional(),
        year: z.number().optional(),
        result: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [movieId, categoryId, yearStr] = input.id.split("_");
        const year = parseInt(yearStr);

        const movie = await ctx.prisma.movies.findUnique({
          where: { id: movieId },
        });

        if (!movie) throw new Error("Movie not found");

        const updatedNominations = movie.nominations.map((nom) => {
          if (nom.categoryId === categoryId && nom.year === year) {
            return {
              ...nom,
              result: input.result || nom.result,
              categoryId: input.categoryId || nom.categoryId,
              year: input.year || nom.year,
            };
          }
          return nom;
        });

        await ctx.prisma.movies.update({
          where: { id: movieId },
          data: {
            nominations: updatedNominations,
          },
        });

        return {
          id: input.id,
          movieId,
          categoryId: input.categoryId || categoryId,
          year: input.year || year,
          result: input.result,
        };
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
        const [movieId, categoryId, yearStr] = input.id.split("_");
        const year = parseInt(yearStr);

        const movie = await ctx.prisma.movies.findUnique({
          where: { id: movieId },
        });

        if (!movie) throw new Error("Movie not found");

        const updatedNominations = movie.nominations.filter(
          (nom) => !(nom.categoryId === categoryId && nom.year === year)
        );

        await ctx.prisma.movies.update({
          where: { id: movieId },
          data: {
            nominations: updatedNominations,
          },
        });

        return { success: true };
      } catch (error) {
        console.error("Error deleting nomination:", error);
        throw new Error("Failed to delete nomination");
      }
    }),

  getProfessionals: publicProcedure.query(async ({ ctx }) => {
    try {
      const professionals = await ctx.prisma.professionals.findMany();
      return professionals;
    } catch (error) {
      console.error("Error fetching professionals:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch professionals",
      });
    }
  }),

  insertProfessional: publicProcedure
    .input(
      z.object({
        firstName: z.string(),
        lastName: z.string(),
        birthDate: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const professional = await ctx.prisma.professionals.create({
          data: {
            id: new ObjectId().toString(),
            firstName: input.firstName,
            lastName: input.lastName,
            dateOfBirth: input.birthDate,
            awardsWon: 0,
            nominations: [],
          },
        });
        return professional;
      } catch (error) {
        console.error("Error inserting professional:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to insert professional",
        });
      }
    }),

  updateProfessional: publicProcedure
    .input(
      z.object({
        id: z.string(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        nationality: z.string().optional(),
        birthDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updateData } = input;
        const professional = await ctx.prisma.professionals.update({
          where: { id },
          data: {
            firstName: updateData.firstName,
            lastName: updateData.lastName,
            dateOfBirth: updateData.birthDate,
          },
        });
        return professional;
      } catch (error) {
        console.error("Error updating professional:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update professional",
        });
      }
    }),

  deleteProfessional: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.professionals.delete({
          where: { id: input.id },
        });
        return { success: true };
      } catch (error) {
        console.error("Error deleting professional:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete professional",
        });
      }
    }),
});
