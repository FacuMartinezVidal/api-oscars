"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { NominationMovies } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOVIE } from "@/supabase/schema";

type Movie = {
  id: string;
  title: string;
  year: number;
  synopsis: string;
  nominations: {
    categoryId: string;
    categoryName?: string;
    result: string;
    year: number;
  }[];
};

type MongoMovie = {
  id: string;
  title: string;
  year: number;
  genre: string;
  synopsis: string;
  awardsWon: number;
  nominations: {
    categoryId: string;
    result: string;
    year: number;
  }[];
};

type SqlMovie = typeof MOVIE.$inferSelect & {
  CategoryName?: string;
};

const MovieNominations = () => {
  const [database, setDatabase] = useState<"mongodb" | "cassandra" | "sql">(
    "mongodb"
  );

  const mongoMovies = trpc.mongo.getMoviesNominated.useQuery();
  const cassandraMovies = trpc.cassandra.get_movies_by_category.useQuery();
  const sqlMovies =
    trpc.sql.getMoviesNominatedInDifferentCategoriesLastThreeYears.useQuery();

  const getMoviesForCurrentDB = () => {
    switch (database) {
      case "mongodb":
        return mongoMovies.data
          ? normalizeMovies(mongoMovies.data as MongoMovie[], "mongodb")
          : [];
      case "cassandra":
        return cassandraMovies.data
          ? normalizeMovies(
              cassandraMovies.data as movies_by_category[],
              "cassandra"
            )
          : [];
      case "sql":
        return sqlMovies.data
          ? normalizeMovies(sqlMovies.data as SqlMovie[], "sql")
          : [];
    }
  };

  const getCurrentError = () => {
    switch (database) {
      case "mongodb":
        return mongoMovies.error;
      case "cassandra":
        return cassandraMovies.error;
      case "sql":
        return sqlMovies.error;
    }
  };

  const normalizeMovies = (
    data: (movies_by_category | MongoMovie | SqlMovie)[],
    dbType: "mongodb" | "cassandra" | "sql"
  ): Movie[] => {
    if (!Array.isArray(data)) return [];

    // Handle SQL data
    if (dbType === "sql") {
      console.log("Normalizing SQL data:", data); // Debug log

      const movieMap = new Map<string, Movie>();

      (data as SqlMovie[]).forEach((sqlMovie) => {
        const movieId = sqlMovie.MovieID?.toString() || "";

        if (!movieId) {
          console.warn("Found SQL movie without ID:", sqlMovie);
          return;
        }

        if (!movieMap.has(movieId)) {
          movieMap.set(movieId, {
            id: movieId,
            title: sqlMovie.Title || "Unknown Title",
            year: sqlMovie.Year || new Date().getFullYear(),
            synopsis: sqlMovie.Synopsis || "",
            nominations: [],
          });
        }

        const movie = movieMap.get(movieId)!;
        if (
          sqlMovie.CategoryName &&
          !movie.nominations.some((n) => n.categoryId === sqlMovie.CategoryName)
        ) {
          movie.nominations.push({
            categoryId: sqlMovie.CategoryName,
            categoryName: sqlMovie.CategoryName,
            result: "Nominated",
            year: sqlMovie.Year || new Date().getFullYear(),
          });
        }
      });

      const normalizedMovies = Array.from(movieMap.values());
      console.log("Normalized SQL movies:", normalizedMovies); // Debug log
      return normalizedMovies;
    }

    // Handle MongoDB and Cassandra cases
    return data.map((movie) => {
      if (dbType === "cassandra") {
        const cassandraMovie = movie as movies_by_category;
        return {
          id: cassandraMovie.movie,
          title: cassandraMovie.movie,
          year: cassandraMovie.year,
          synopsis: cassandraMovie.synopsis,
          nominations: cassandraMovie.nominations.map((nom) => ({
            categoryId: nom,
            result: "Nominated",
            year: cassandraMovie.year,
          })),
        };
      } else {
        const mongoMovie = movie as MongoMovie;
        return {
          id: mongoMovie.id,
          title: mongoMovie.title,
          year: mongoMovie.year,
          synopsis: mongoMovie.synopsis,
          nominations: mongoMovie.nominations.map((nom) => ({
            categoryId: nom.categoryId,
            categoryName: nom.categoryId,
            result: nom.result,
            year: nom.year,
          })),
        };
      }
    });
  };

  return (
    <div className="py-12 px-4 bg-gray-100">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">
            Películas Nominadas en Múltiples Categorías
          </h1>

          <Tabs
            defaultValue="mongodb"
            onValueChange={(value) =>
              setDatabase(value as "mongodb" | "cassandra" | "sql")
            }
            className="mb-6"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="mongodb">MongoDB</TabsTrigger>
              <TabsTrigger value="cassandra">Cassandra</TabsTrigger>
              <TabsTrigger value="sql">SQL</TabsTrigger>
            </TabsList>
          </Tabs>

          {getCurrentError() && (
            <div className="text-center text-red-600 my-8">
              Error al cargar las películas
            </div>
          )}

          {getMoviesForCurrentDB().length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {getMoviesForCurrentDB().map((movie, index) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                >
                  <div className="p-6">
                    <motion.h3
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="text-2xl font-bold text-gray-900 mb-2"
                    >
                      {movie.title}
                    </motion.h3>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      className="flex items-center gap-2 mb-4"
                    >
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {movie.year}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-600">
                        {movie.nominations.length} nominaciones
                      </span>
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                      className="text-gray-700 mb-4 line-clamp-3"
                    >
                      {movie.synopsis}
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                      className="space-y-3"
                    >
                      <p className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Nominaciones:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {movie.nominations.map((nomination, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              duration: 0.2,
                              delay: 0.6 + index * 0.1,
                            }}
                            className="group relative"
                          >
                            <span className="inline-block px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors duration-200">
                              {nomination.categoryName || nomination.categoryId}
                            </span>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                              {nomination.year} - {nomination.result}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center text-gray-600 mt-4">
              No se encontraron películas
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieNominations;
