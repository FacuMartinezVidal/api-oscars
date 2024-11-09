"use client";

import { trpc } from "@/utils/trpc";
import { Loader2, Trophy, Star, Film } from "lucide-react";
import { motion } from "framer-motion";

const ActorMostAwarded = () => {
  const actor = trpc.mongo.getMostAwardedActor.useQuery();

  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">
            Actor Más Premiado en la Historia
          </h1>

          {/* Loading state */}
          {actor.isFetching && (
            <div className="text-center text-gray-600">
              <Loader2 className="mx-auto h-8 w-8 animate-spin" />
              <p className="mt-2">Cargando información...</p>
            </div>
          )}

          {/* Error state */}
          {actor.error && (
            <div className="text-center text-red-600">
              Error al cargar la información
            </div>
          )}

          {/* Actor card */}
          {actor.data && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg overflow-hidden shadow-lg border border-purple-200 p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="flex items-center gap-4"
                  >
                    <Trophy className="h-12 w-12 text-purple-500" />
                    <div>
                      <h2 className="text-3xl font-bold text-gray-800">
                        {actor.data.firstName} {actor.data.lastName}
                      </h2>
                      <p className="text-gray-600">
                        Fecha de Nacimiento:{" "}
                        {new Date(actor.data.dateOfBirth).toLocaleDateString(
                          "es-ES",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="flex items-center gap-2 bg-purple-100 px-6 py-3 rounded-full"
                  >
                    <Star className="h-6 w-6 text-purple-600" />
                    <span className="text-2xl font-bold text-purple-600">
                      {actor.data.awardsWon} Oscar
                      {actor.data.awardsWon !== 1 ? "s" : ""}
                    </span>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className="mt-8"
                >
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Historial de Nominaciones
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {actor.data.nominations.map((nomination, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.2,
                          delay: 0.5 + index * 0.1,
                        }}
                        className={`p-4 rounded-lg ${
                          nomination.result === "Winner"
                            ? "bg-purple-100 border border-purple-200"
                            : "bg-gray-50 border border-gray-200"
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <span
                            className={`font-medium ${
                              nomination.result === "Winner"
                                ? "text-purple-700"
                                : "text-gray-700"
                            }`}
                          >
                            {nomination.category}
                          </span>
                          <span className="text-sm text-gray-600">
                            {nomination.year}
                          </span>
                          <span className="text-sm text-gray-500">
                            {nomination.awardId}
                          </span>
                          <div className="flex items-center gap-1 mt-2">
                            <Film className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {nomination.movie}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* Empty state */}
          {!actor.data && !actor.isFetching && !actor.error && (
            <div className="text-center text-gray-600 mt-4">
              No se encontró información del actor más premiado
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActorMostAwarded;
