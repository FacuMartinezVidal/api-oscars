import { publicProcedure, router } from "../trpc";
import { z } from "zod";
import { types } from "cassandra-driver"; // Añade esta importación

const keyspace = "oscars";

export const cassandraRouter = router({
  // Consulta general para el gestor de películas
  get_movies_by_category: publicProcedure.query(async ({ ctx }) => {
    try {
      const result = await ctx.cassandra.execute(
        `SELECT movie, year, nominations, genre, synopsis 
         FROM ${keyspace}.movies_by_category`
      );

      if (!result.rows || result.rows.length === 0) {
        return [];
      }

      return result.rows.map((row: movies_by_category) => ({
        movie: row.movie,
        year: row.year,
        synopsis: row.synopsis || "",
        genre: row.genre || "",
        nominations: row.nominations || [],
      }));
    } catch (error) {
      console.error("Error fetching movies by category:", error);
      throw new Error("Failed to fetch movies by category");
    }
  }),

  // Películas más premiadas
  get_movies_by_awards: publicProcedure.query(async ({ ctx }) => {
    try {
      const result = await ctx.cassandra.execute(
        `SELECT movie, year, awards_count
         FROM ${keyspace}.awards_by_movie
         WHERE partition_key = 'awards' 
         ORDER BY awards_count DESC`,
        [],
        { prepare: true }
      );

      if (!result.rows || result.rows.length === 0) {
        return []; // Return empty array if no results
      }

      return result.rows.map((row: any) => ({
        movie: row.movie,
        year: row.year,
        awards_count: row.awards_count,
      }));
    } catch (error) {
      console.error("Error fetching awarded movies:", error);
      throw new Error(`Failed to fetch awarded movies: ${error}`);
    }
  }),

  // Insertar película
  insert_movie: publicProcedure
    .input(
      z.object({
        title: z.string(),
        year: z.number(),
        synopsis: z.string(),
        genre: z.string(),
        useCase: z.enum(["category", "awards", "nominations", "votes"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const queries = [];

        // Insert para movies_by_category
        queries.push({
          query: `INSERT INTO ${keyspace}.movies_by_category 
                 (movie, year, synopsis, genre, nominations) 
                 VALUES (?, ?, ?, ?, ?)`,
          params: [input.title, input.year, input.synopsis, input.genre, []],
        });

        // Insert para awards_by_movie
        if (input.useCase === "awards") {
          queries.push({
            query: `INSERT INTO ${keyspace}.awards_by_movie 
                   (partition_key, movie, year, awards_won, category) 
                   VALUES (?, ?, ?, ?, ?)`,
            params: ["11-20", input.title, input.year, 0, []],
          });
        }

        // Insert para movies_by_nominations_count
        if (input.useCase === "nominations") {
          queries.push({
            query: `INSERT INTO ${keyspace}.movies_by_nominations_count 
                   (movie_name, year, genre, nominations_count, synopsis) 
                   VALUES (?, ?, ?, ?, ?)`,
            params: [input.title, input.year, input.genre, 0, input.synopsis],
          });
        }

        // Insert para movies_by_votes_category
        if (input.useCase === "votes") {
          queries.push({
            query: `INSERT INTO ${keyspace}.movies_by_votes_category 
                   (movie_name, category, votes, synopsis) 
                   VALUES (?, ?, ?, ?)`,
            params: [input.title, "most_votes", 0, input.synopsis],
          });
        }

        await ctx.cassandra.batch(queries, { prepare: true });
        return { success: true, id: `${input.title}_${input.year}` };
      } catch (error) {
        console.error("Error inserting movie in Cassandra:", error);
        throw new Error("Failed to insert movie");
      }
    }),

  // Actualizar película
  update_movie: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        year: z.number().optional(),
        synopsis: z.string().optional(),
        genre: z.string().optional(),
        useCase: z.enum(["category", "awards", "nominations", "votes"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [oldTitle, oldYearStr] = input.id.split("_");
        const oldYear = parseInt(oldYearStr);
        const queries = [];

        // Si hay cambios en el título o año, necesitamos hacer delete + insert
        const titleChanged = input.title && input.title !== oldTitle;
        const yearChanged = input.year && input.year !== oldYear;

        if (titleChanged || yearChanged) {
          // Primero eliminamos el registro antiguo
          queries.push({
            query: `DELETE FROM ${keyspace}.movies_by_category WHERE movie = ? AND year = ?`,
            params: [oldTitle, oldYear],
          });

          // Luego insertamos el nuevo
          queries.push({
            query: `INSERT INTO ${keyspace}.movies_by_category (movie, year, synopsis, genre, nominations) VALUES (?, ?, ?, ?, ?)`,
            params: [
              input.title || oldTitle,
              input.year || oldYear,
              input.synopsis || "",
              input.genre || "",
              [],
            ],
          });

          // Manejar las tablas específicas según el caso de uso
          switch (input.useCase) {
            case "awards":
              queries.push({
                query: `DELETE FROM ${keyspace}.awards_by_movie WHERE partition_key = '11-20' AND movie = ? AND year = ?`,
                params: [oldTitle, oldYear],
              });
              queries.push({
                query: `INSERT INTO ${keyspace}.awards_by_movie (partition_key, movie, year, awards_won, category) VALUES (?, ?, ?, ?, ?)`,
                params: [
                  "11-20",
                  input.title || oldTitle,
                  input.year || oldYear,
                  0,
                  [],
                ],
              });
              break;

            case "nominations":
              queries.push({
                query: `DELETE FROM ${keyspace}.movies_by_nominations_count WHERE movie_name = ? AND year = ?`,
                params: [oldTitle, oldYear],
              });
              queries.push({
                query: `INSERT INTO ${keyspace}.movies_by_nominations_count (movie_name, year, genre, nominations_count, synopsis) VALUES (?, ?, ?, ?, ?)`,
                params: [
                  input.title || oldTitle,
                  input.year || oldYear,
                  input.genre || "",
                  0,
                  input.synopsis || "",
                ],
              });
              break;

            case "votes":
              queries.push({
                query: `DELETE FROM ${keyspace}.movies_by_votes_category WHERE movie_name = ? AND category IN ('most_votes', 'least_votes')`,
                params: [oldTitle],
              });
              queries.push({
                query: `INSERT INTO ${keyspace}.movies_by_votes_category (movie_name, category, votes, synopsis) VALUES (?, ?, ?, ?)`,
                params: [
                  input.title || oldTitle,
                  "most_votes",
                  0,
                  input.synopsis || "",
                ],
              });
              break;
          }
        } else {
          // Si solo hay cambios en synopsis o genre, podemos usar UPDATE
          if (input.synopsis || input.genre) {
            const setClauses = [];
            const params = [];

            if (input.synopsis) {
              setClauses.push("synopsis = ?");
              params.push(input.synopsis);
            }
            if (input.genre) {
              setClauses.push("genre = ?");
              params.push(input.genre);
            }

            // Update para movies_by_category
            queries.push({
              query: `UPDATE ${keyspace}.movies_by_category SET ${setClauses.join(
                ", "
              )} WHERE movie = ? AND year = ?`,
              params: [...params, oldTitle, oldYear],
            });

            // Update para la tabla específica según el caso de uso
            switch (input.useCase) {
              case "awards":
                if (input.synopsis) {
                  queries.push({
                    query: `UPDATE ${keyspace}.awards_by_movie SET synopsis = ? WHERE partition_key = '11-20' AND movie = ? AND year = ?`,
                    params: [input.synopsis, oldTitle, oldYear],
                  });
                }
                break;

              case "nominations":
                queries.push({
                  query: `UPDATE ${keyspace}.movies_by_nominations_count SET ${setClauses.join(
                    ", "
                  )} WHERE movie_name = ? AND year = ?`,
                  params: [...params, oldTitle, oldYear],
                });
                break;

              case "votes":
                if (input.synopsis) {
                  queries.push({
                    query: `UPDATE ${keyspace}.movies_by_votes_category SET synopsis = ? WHERE movie_name = ? AND category IN ('most_votes', 'least_votes')`,
                    params: [input.synopsis, oldTitle],
                  });
                }
                break;
            }
          }
        }

        if (queries.length > 0) {
          await ctx.cassandra.batch(queries, { prepare: true });
        }

        return { success: true };
      } catch (error) {
        console.error("Error updating movie in Cassandra:", error);
        throw new Error("Failed to update movie");
      }
    }),

  delete_movie: publicProcedure
    .input(
      z.object({
        id: z.string(),
        useCase: z.enum(["category", "awards", "nominations", "votes"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [movie, yearStr] = input.id.split("_");
        const year = parseInt(yearStr);
        const queries = [];

        // Delete de movies_by_category
        queries.push({
          query: `DELETE FROM ${keyspace}.movies_by_category 
                 WHERE movie = ? AND year = ?`,
          params: [movie, year],
        });

        // Delete para cada caso específico
        switch (input.useCase) {
          case "awards":
            queries.push({
              query: `DELETE FROM ${keyspace}.awards_by_movie 
                     WHERE partition_key = '11-20' AND movie = ? AND year = ?`,
              params: [movie, year],
            });
            break;

          case "nominations":
            queries.push({
              query: `DELETE FROM ${keyspace}.movies_by_nominations_count 
                     WHERE movie_name = ? AND year = ?`,
              params: [movie, year],
            });
            break;

          case "votes":
            queries.push({
              query: `DELETE FROM ${keyspace}.movies_by_votes_category 
                     WHERE movie_name = ? AND category IN ('most_votes', 'least_votes')`,
              params: [movie],
            });
            break;
        }

        await ctx.cassandra.batch(queries, { prepare: true });
        return { success: true };
      } catch (error) {
        console.error("Error deleting movie in Cassandra:", error);
        throw new Error("Failed to delete movie");
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

  insert_nomination: publicProcedure
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
        const queries = [];

        // Update movies_by_nominations_count
        queries.push({
          query: `UPDATE ${keyspace}.movies_by_nominations_count 
                  SET nominations_count = nominations_count + 1 
                  WHERE movie_name = ? AND year = ?`,
          params: [input.movieId, input.year],
        });

        // Insert into nominations_by_movie
        queries.push({
          query: `INSERT INTO ${keyspace}.nominations_by_movie 
                  (movie_name, year, category_id, result) 
                  VALUES (?, ?, ?, ?)`,
          params: [input.movieId, input.year, input.categoryId, input.result],
        });

        await ctx.cassandra.batch(queries, { prepare: true });
        return { success: true };
      } catch (error) {
        console.error("Error inserting nomination:", error);
        throw new Error("Failed to insert nomination");
      }
    }),

  update_nomination: publicProcedure
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
        const [movieName, yearStr] = input.id.split("_");
        const year = parseInt(yearStr);

        const queries = [];

        if (input.result) {
          queries.push({
            query: `UPDATE ${keyspace}.nominations_by_movie 
                    SET result = ? 
                    WHERE movie_name = ? AND year = ? AND category_id = ?`,
            params: [input.result, movieName, year, input.categoryId],
          });
        }

        if (queries.length > 0) {
          await ctx.cassandra.batch(queries, { prepare: true });
        }

        return { success: true };
      } catch (error) {
        console.error("Error updating nomination:", error);
        throw new Error("Failed to update nomination");
      }
    }),

  delete_nomination: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [movieName, yearStr] = input.id.split("_");
        const year = parseInt(yearStr);

        const queries = [];

        // Update nomination count
        queries.push({
          query: `UPDATE ${keyspace}.movies_by_nominations_count 
                  SET nominations_count = nominations_count - 1 
                  WHERE movie_name = ? AND year = ?`,
          params: [movieName, year],
        });

        // Delete from nominations_by_movie
        queries.push({
          query: `DELETE FROM ${keyspace}.nominations_by_movie 
                  WHERE movie_name = ? AND year = ?`,
          params: [movieName, year],
        });

        await ctx.cassandra.batch(queries, { prepare: true });
        return { success: true };
      } catch (error) {
        console.error("Error deleting nomination:", error);
        throw new Error("Failed to delete nomination");
      }
    }),

  getAllProfessionals: publicProcedure.query(async ({ ctx }) => {
    try {
      const result = await ctx.cassandra.execute(
        `SELECT actor_name, birthdate, awards_won, nominations 
         FROM ${keyspace}.awards_by_actor 
         WHERE partition_key = '21-30'`
      );

      return result.rows.map((row: awards_by_actor) => ({
        id: row.actor_name,
        firstName: row.actor_name.split(" ")[0],
        lastName: row.actor_name.split(" ").slice(1).join(" "),
        birthDate: row.birthdate,
        awardsWon: row.awards_won,
        nominations: row.nominations || [],
      }));
    } catch (error) {
      console.error("Error fetching professionals:", error);
      throw new Error("Failed to fetch professionals");
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
        const fullName = `${input.firstName} ${input.lastName}`;
        await ctx.cassandra.execute(
          `INSERT INTO ${keyspace}.awards_by_actor 
           (partition_key, actor_name, birthdate, awards_won, nominations) 
           VALUES (?, ?, ?, ?, ?)`,
          ["21-30", fullName, new Date(input.birthDate), 0, []],
          { prepare: true }
        );
        return { success: true };
      } catch (error) {
        console.error("Error inserting professional:", error);
        throw new Error("Failed to insert professional");
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
        const [oldName] = input.id.split("_");

        // First get all professionals to find the one we want to update
        const result = await ctx.cassandra.execute(
          `SELECT * FROM ${keyspace}.awards_by_actor 
           WHERE partition_key = '21-30'`,
          [],
          { prepare: true }
        );

        const professional = result.rows.find(
          (row: any) => row.actor_name === oldName
        );
        if (!professional) {
          throw new Error("Professional not found");
        }

        const newName =
          input.firstName || input.lastName
            ? `${input.firstName || oldName.split(" ")[0]} ${
                input.lastName || oldName.split(" ").slice(1).join(" ")
              }`
            : oldName;

        if (input.birthDate || newName !== oldName) {
          // Delete old record
          await ctx.cassandra.execute(
            `DELETE FROM ${keyspace}.awards_by_actor 
             WHERE partition_key = '21-30' AND awards_won = ? AND actor_name = ?`,
            [professional.awards_won, oldName],
            { prepare: true }
          );

          // Insert new record with updated data
          await ctx.cassandra.execute(
            `INSERT INTO ${keyspace}.awards_by_actor 
             (partition_key, actor_name, birthdate, awards_won, nominations) 
             VALUES (?, ?, ?, ?, ?)`,
            [
              "21-30",
              newName,
              input.birthDate
                ? new Date(input.birthDate)
                : professional.birthdate,
              professional.awards_won,
              professional.nominations,
            ],
            { prepare: true }
          );
        }

        return { success: true };
      } catch (error) {
        console.error("Error updating professional:", error);
        throw new Error("Failed to update professional");
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
        await ctx.cassandra.execute(
          `DELETE FROM ${keyspace}.awards_by_actor 
           WHERE partition_key = '21-30' AND actor_name = ?`,
          [input.id],
          { prepare: true }
        );
        return { success: true };
      } catch (error) {
        console.error("Error deleting professional:", error);
        throw new Error("Failed to delete professional");
      }
    }),
});
