import { publicProcedure, router } from "../trpc";
import { z } from "zod";
import { types } from "cassandra-driver"; // Añade esta importación

const keyspace = "oscars";

export const cassandraRouter = router({
  //¿Cuántas películas han sido nominadas en diferentes categorías en los últimos n años?
  get_movies_by_category: publicProcedure.query(async ({ ctx, input }) => {
    try {
      const result = await ctx.cassandra.execute(
        `select * from ${keyspace}.movies_by_category limit 5`
      );
      const movies = result.rows;

      return movies;
    } catch (error) {
      console.error("Error fetching movies by category:", error);
      throw new Error("Failed to fetch movies by category");
    }
  }),
  get_proffesional_by_awards: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.cassandra.execute(
      `select * from ${keyspace}.awards_by_actor where partition_key = '21-30'
        ORDER BY awards_won DESC limit 1`
    );
    const awards: awards_by_actor[] = result.rows;
    return awards;
  }),
  get_director_by_nominations: publicProcedure
    .input(
      z.object({
        director_name: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.cassandra.execute(
        `select * from ${keyspace}.nominations_by_director where director_name = ?`,
        [input.director_name]
      );
      const director: nominations_by_director[] = result.rows;
      return director[0];
    }),
  get_movies_most_awarded: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.cassandra.execute(
      `select * from ${keyspace}.awards_by_movie where partition_key= '11-20'
        ORDER BY awards_won DESC `
    );
    const movies: awards_by_movie[] = result.rows;
    return movies;
  }),

  get_movies_by_nominations_count: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.cassandra.execute(
      `select * from ${keyspace}.movies_by_nominations_count where genre='Sci-Fi' and nominations_count > 5`
    );
    const movies: movies_by_nominations_count[] = result.rows;
    return movies;
  }),
  get_movies_by_votes: publicProcedure.query(async ({ ctx }) => {
    const result_least_voted = await ctx.cassandra.execute(
      `select * from ${keyspace}.movies_by_votes_category  where category = 'least_votes'`
    );
    const result_most_voted = await ctx.cassandra.execute(
      `select * from ${keyspace}.movies_by_votes_category  where category = 'most_votes'`
    );
    const movies_least_voted: movies_by_votes_category[] =
      result_least_voted.rows;
    const movies_most_voted: movies_by_votes_category[] =
      result_most_voted.rows;
    return { movies_least_voted, movies_most_voted };
  }),

  get_actors_by_awards: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.cassandra.execute(
      `select * from ${keyspace}.actors_awards where has_won_award = false`
    );
    const actors: actors_awards[] = result.rows;
    return actors;
  }),
});
