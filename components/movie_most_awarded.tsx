"use client";

import { trpc } from "@/utils/trpc";
import { Loader2, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MovieMostAwarded = () => {
  const cassandraMovies = trpc.cassandra.get_movies_most_awarded.useQuery();
  const mongoMovies = trpc.mongo.getMostAwardedMovies.useQuery();
  const sqlMovies = trpc.sql.getMostAwardedMovies.useQuery();

  const MovieList = ({ data, isLoading, error }: any) => {
    // Transform data to consistent format
    const normalizedData = data?.map((movie: any) => {
      if (movie.category) {
        // Cassandra data format
        return {
          id: movie.movie,
          title: movie.movie,
          awardsWon: movie.awards_won,
          year: movie.year,
          synopsis: movie.synopsis,
          nominations: movie.category.map((cat: string) => ({
            categoryId: cat,
            result: "Winner", // In awards_by_movie, all categories are winners
          })),
        };
      } else if (movie.Categories) {
        // SQL format
        return {
          id: movie.MovieID,
          title: movie.Title,
          awardsWon: movie.TotalAwards,
          year: movie.Year,
          synopsis: movie.Synopsis,
          nominations: movie.Categories.split(", ").map((cat: string) => ({
            categoryId: cat,
            result: "Winner",
          })),
        };
      } else {
        // MongoDB data format
        return {
          id: movie.id,
          title: movie.title,
          awardsWon: movie.awardsWon,
          year: movie.year,
          synopsis: movie.synopsis,
          nominations: movie.nominations,
        };
      }
    });

    return (
      <>
        {error && (
          <div className="text-center text-red-600">
            Error al cargar las películas
          </div>
        )}

        {data && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 gap-6"
          >
            {normalizedData.map((movie: any, index: number) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border border-amber-200"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <motion.h3
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="text-2xl font-bold text-gray-800 flex items-center gap-2"
                    >
                      <Trophy className="h-6 w-6 text-amber-500" />
                      {movie.title}
                    </motion.h3>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      className="flex items-center gap-2"
                    >
                      <span className="text-lg font-bold text-amber-600">
                        {movie.awardsWon} Oscar
                        {movie.awardsWon !== 1 ? "s" : ""}
                      </span>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="mb-4"
                  >
                    <span className="text-gray-600 text-lg">
                      Año: {movie.year}
                    </span>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    className="text-gray-700 text-base mb-4"
                  >
                    {movie.synopsis}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wider mb-2">
                      Categorías Ganadoras:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {movie.nominations
                        .filter(
                          (nomination: {
                            result: string;
                            categoryId: string;
                          }) => nomination.result === "Winner"
                        )
                        .map(
                          (
                            nomination: { result: string; categoryId: string },
                            index: number
                          ) => (
                            <motion.span
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{
                                duration: 0.2,
                                delay: 0.6 + index * 0.1,
                              }}
                              className="inline-block px-3 py-1 text-sm font-medium bg-amber-100 text-amber-800 rounded-full"
                            >
                              {nomination.categoryId}
                            </motion.span>
                          )
                        )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {data?.length === 0 && !isLoading && (
          <div className="text-center text-gray-600 mt-4">
            No se encontraron películas
          </div>
        )}
      </>
    );
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">
            Películas Más Premiadas en la Historia
          </h1>

          <Tabs defaultValue="mongodb" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="mongodb">MongoDB</TabsTrigger>
              <TabsTrigger value="cassandra">Cassandra</TabsTrigger>
              <TabsTrigger value="sql">SQL</TabsTrigger>
            </TabsList>
            <TabsContent value="mongodb">
              <MovieList
                data={mongoMovies.data}
                isLoading={mongoMovies.isFetching}
                error={mongoMovies.error}
              />
            </TabsContent>
            <TabsContent value="cassandra">
              <MovieList
                data={cassandraMovies.data}
                isLoading={cassandraMovies.isFetching}
                error={cassandraMovies.error}
              />
            </TabsContent>
            <TabsContent value="sql">
              <MovieList
                data={sqlMovies.data}
                isLoading={sqlMovies.isFetching}
                error={sqlMovies.error}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MovieMostAwarded;
