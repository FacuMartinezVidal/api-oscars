"use client";

import { trpc } from "@/utils/trpc";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const MovieAwards = () => {
  const movies = trpc.mongo.getMoviesNominatedAndAwardsWon.useQuery();

  return (
    <div className=" py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">
            Películas Premiadas con Múltiples Nominaciones
          </h1>

          {/* Loading state */}
          {movies.isFetching && (
            <div className="text-center text-gray-600">
              <Loader2 className="mx-auto h-8 w-8 animate-spin" />
              <p className="mt-2">Cargando películas...</p>
            </div>
          )}

          {/* Error state */}
          {movies.error && (
            <div className="text-center text-red-600">
              Error al cargar las películas
            </div>
          )}

          {/* Movies grid */}
          {movies.data && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {movies.data.map((movie, index) => (
                <motion.div
                  key={movie.id}
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
                      {movie.title}
                    </motion.h3>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      className="flex justify-between mb-3"
                    >
                      <span className="text-sm text-gray-600">
                        Año: {movie.year}
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        Premios: {movie.awardsWon}
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
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                    >
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                        Nominaciones y Resultados:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {movie.nominations.map((nomination, index) => (
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
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Empty state */}
          {movies.data?.length === 0 && !movies.isFetching && (
            <div className="text-center text-gray-600 mt-4">
              No se encontraron películas premiadas
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieAwards;
