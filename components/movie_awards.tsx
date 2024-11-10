"use client";

import { trpc } from "@/utils/trpc";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MovieAwards = () => {
  const mongoMovies = trpc.mongo.getMoviesNominatedAndAwardsWon.useQuery();
  const cassandraMovies = trpc.cassandra.get_movies_most_awarded.useQuery();
  const sqlMovies = trpc.sql.getMoviesNominatedAndAwardsWon.useQuery();

  const renderMovieGrid = (
    movies: any[],
    source: "mongo" | "cassandra" | "sql"
  ) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      {movies.map((movie, index) => (
        <motion.div
          key={
            source === "cassandra"
              ? movie.movie
              : source === "sql"
              ? movie.MovieID
              : movie.id
          }
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
        >
          <div className="p-5">
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="text-xl font-semibold text-gray-800 mb-2 truncate"
            >
              {source === "cassandra"
                ? movie.movie
                : source === "sql"
                ? movie.Title
                : movie.title}
            </motion.h3>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="flex justify-between mb-3"
            >
              <span className="text-sm text-gray-600">
                Año: {source === "sql" ? movie.Year : movie.year}
              </span>
              <span className="text-sm font-medium text-green-600">
                {source === "sql"
                  ? `Nominaciones: ${movie.TotalNominations}, Premios: ${movie.TotalAwards}`
                  : `Premios: ${movie.awards_won || movie.awardsWon}`}
              </span>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="text-gray-700 text-sm mb-4 line-clamp-3"
            >
              {movie.synopsis}
            </motion.p>
            {source === "sql" ? (
              <motion.div>
                <div className="flex gap-3">
                  <span className="inline-block px-3 py-1 text-sm font-medium rounded bg-blue-100 text-blue-800">
                    Nominaciones: {movie.TotalNominations}
                  </span>
                  <span className="inline-block px-3 py-1 text-sm font-medium rounded bg-green-100 text-green-800">
                    Premios: {movie.TotalAwards}
                  </span>
                </div>
              </motion.div>
            ) : source === "cassandra" ? (
              <motion.div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                  Categorías:
                </p>
                <div className="flex flex-wrap gap-2">
                  {movie.category.map((cat: string, index: number) => (
                    <motion.span
                      key={index}
                      className="inline-block px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800"
                    >
                      {cat}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                  Nominaciones y Resultados:
                </p>
                <div className="flex flex-wrap gap-2">
                  {movie.nominations.map((nomination: any, index: number) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.2,
                        delay: 0.6 + index * 0.1,
                      }}
                      className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                        nomination.result === "Winner"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {nomination.categoryId}
                      {" - "}
                      {nomination.result}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );

  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">
            Películas Premiadas con Múltiples Nominaciones
          </h1>

          <Tabs defaultValue="mongodb" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="mongodb">MongoDB</TabsTrigger>
              <TabsTrigger value="cassandra">Cassandra</TabsTrigger>
              <TabsTrigger value="sql">SQL</TabsTrigger>
            </TabsList>

            <TabsContent value="mongodb">
              {mongoMovies.error && (
                <div className="text-center text-red-600">
                  Error al cargar las películas
                </div>
              )}
              {mongoMovies.data && renderMovieGrid(mongoMovies.data, "mongo")}
            </TabsContent>

            <TabsContent value="cassandra">
              {cassandraMovies.error && (
                <div className="text-center text-red-600">
                  Error al cargar las películas
                </div>
              )}
              {cassandraMovies.data &&
                renderMovieGrid(cassandraMovies.data, "cassandra")}
            </TabsContent>

            <TabsContent value="sql">
              {sqlMovies.error && (
                <div className="text-center text-red-600">
                  Error al cargar las películas
                </div>
              )}
              {sqlMovies.data && renderMovieGrid(sqlMovies.data, "sql")}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MovieAwards;
