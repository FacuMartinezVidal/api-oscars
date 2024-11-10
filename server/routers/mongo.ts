import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { MOVIE } from "@/supabase/schema";

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
            message: "Se debe proporcionar un término de búsqueda",
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
});
