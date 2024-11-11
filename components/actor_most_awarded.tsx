"use client";

import { trpc } from "@/utils/trpc";
import { Loader2, Trophy, Star, Film } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const ActorMostAwarded = () => {
  const mongoActor = trpc.mongo.getMostAwardedActor.useQuery();
  const cassandraActor = trpc.cassandra.get_proffesional_by_awards.useQuery();
  const sqlActor = trpc.sql.getMostAwardedActorWithNominations.useQuery();

  const renderSkeleton = () => (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg overflow-hidden shadow-lg border border-purple-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-12 w-32 rounded-full" />
      </div>
      <Skeleton className="h-6 w-48 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">
            Caso de uso N°2
          </h1>

          <Tabs defaultValue="mongo" className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="mongo">MongoDB</TabsTrigger>
              <TabsTrigger value="cassandra">Cassandra</TabsTrigger>
              <TabsTrigger value="sql">SQL</TabsTrigger>
            </TabsList>

            <TabsContent value="mongo">
              {mongoActor.isLoading && renderSkeleton()}
              {mongoActor.error && (
                <div className="text-center text-red-600">
                  Error al cargar la información
                </div>
              )}

              {mongoActor.data && (
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
                            {mongoActor.data.firstName}{" "}
                            {mongoActor.data.lastName}
                          </h2>
                          <p className="text-gray-600">
                            Fecha de Nacimiento:{" "}
                            {new Date(
                              mongoActor.data.dateOfBirth
                            ).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
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
                          {mongoActor.data.awardsWon} Oscar
                          {mongoActor.data.awardsWon !== 1 ? "s" : ""}
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
                        {mongoActor.data.nominations.map(
                          (nomination, index) => (
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
                          )
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="cassandra">
              {cassandraActor.isLoading && renderSkeleton()}
              {cassandraActor.error && (
                <div className="text-center text-red-600">
                  Error al cargar la información
                </div>
              )}

              {cassandraActor.data && (
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
                            {cassandraActor.data[0].actor_name}
                          </h2>
                          <p className="text-gray-600">
                            Fecha de Nacimiento:{" "}
                            {cassandraActor.data[0].birthdate
                              ? new Date(
                                  cassandraActor.data[0].birthdate
                                ).toLocaleDateString("es-ES", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : "No disponible"}
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
                          {cassandraActor.data[0].awards_won} Oscar
                          {cassandraActor.data[0].awards_won !== 1 ? "s" : ""}
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
                        {cassandraActor.data[0].nominations.map(
                          (nomination, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{
                                duration: 0.2,
                                delay: 0.5 + index * 0.1,
                              }}
                              className="p-4 rounded-lg bg-purple-100 border border-purple-200"
                            >
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-purple-700">
                                  {nomination.award}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {nomination.year}
                                </span>
                              </div>
                            </motion.div>
                          )
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="sql">
              {sqlActor.isLoading && renderSkeleton()}
              {sqlActor.error && (
                <div className="text-center text-red-600">
                  Error al cargar la información
                </div>
              )}

              {sqlActor.data && (
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
                            {sqlActor.data.firstName} {sqlActor.data.lastName}
                          </h2>
                          <p className="text-gray-600">
                            Fecha de Nacimiento:{" "}
                            {sqlActor.data.dateOfBirth
                              ? new Date(
                                  sqlActor.data.dateOfBirth
                                ).toLocaleDateString("es-ES", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : "No disponible"}
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
                          {sqlActor.data.awardsWon} Oscar
                          {sqlActor.data.awardsWon !== 1 ? "s" : ""}
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
                        {sqlActor.data.nominations.map((nomination, index) => (
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
            </TabsContent>
          </Tabs>

          {/* Empty state */}
          {!mongoActor.data &&
            !mongoActor.isFetching &&
            !mongoActor.error &&
            !cassandraActor.data &&
            !cassandraActor.isFetching &&
            !cassandraActor.error &&
            !sqlActor.data &&
            !sqlActor.isFetching &&
            !sqlActor.error && (
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
