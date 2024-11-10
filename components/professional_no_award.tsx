"use client";

import { trpc } from "@/utils/trpc";
import { Loader2, User } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProfessionalNoAward = () => {
  const mongoProfessionals =
    trpc.mongo.getMostNominatedNonWinningActors.useQuery();
  const cassandraProfessionals = trpc.cassandra.get_actors_by_awards.useQuery();
  const sqlProfessionals =
    trpc.sql.getActorsNominatedMoreThanThreeTimesAndNeverWonAnAward.useQuery();

  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">
            Profesionales Más Nominados Sin Premio
          </h1>

          <Tabs defaultValue="mongodb" className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="mongodb">MongoDB</TabsTrigger>
              <TabsTrigger value="cassandra">Cassandra</TabsTrigger>
              <TabsTrigger value="sql">SQL</TabsTrigger>
            </TabsList>

            <TabsContent value="mongodb">
              {mongoProfessionals.error && (
                <div className="text-center text-red-600">
                  Error al cargar los profesionales
                </div>
              )}

              {mongoProfessionals.data && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-1 gap-6"
                >
                  {mongoProfessionals.data.map((professional, index) => (
                    <motion.div
                      key={professional.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border border-blue-200"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <motion.h3
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="text-2xl font-bold text-gray-800 flex items-center gap-2"
                          >
                            <User className="h-6 w-6 text-blue-500" />
                            {professional.firstName} {professional.lastName}
                          </motion.h3>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                            className="flex items-center gap-2"
                          >
                            <span className="text-lg font-bold text-blue-600">
                              {professional.nominations.length} Nominaciones
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
                            Fecha de Nacimiento:{" "}
                            {new Date(
                              professional.dateOfBirth
                            ).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.5 }}
                        >
                          <p className="text-sm font-medium text-gray-600 uppercase tracking-wider mb-2">
                            Historial de Nominaciones:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {professional.nominations.map(
                              (nomination, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{
                                    duration: 0.2,
                                    delay: 0.6 + index * 0.1,
                                  }}
                                  className="inline-block px-3 py-2 text-sm font-medium bg-white rounded-lg border border-blue-100"
                                >
                                  <div className="flex flex-col">
                                    <span className="text-blue-800">
                                      {nomination.category}
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                      {nomination.year} - {nomination.awardId}
                                    </span>
                                  </div>
                                </motion.div>
                              )
                            )}
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="cassandra">
              {/* Cassandra Content */}

              {cassandraProfessionals.error && (
                <div className="text-center text-red-600">
                  Error al cargar los profesionales
                </div>
              )}

              {cassandraProfessionals.data && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-1 gap-6"
                >
                  {cassandraProfessionals.data.map((professional, index) => (
                    <motion.div
                      key={`${professional.first_name}-${professional.last_name}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border border-blue-200"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <motion.h3
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="text-2xl font-bold text-gray-800 flex items-center gap-2"
                          >
                            <User className="h-6 w-6 text-blue-500" />
                            {professional.first_name} {professional.last_name}
                          </motion.h3>
                        </div>

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.3 }}
                          className="mb-4"
                        >
                          <span className="text-gray-600 text-lg">
                            Nacionalidad: {professional.nationality}
                          </span>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="sql">
              {sqlProfessionals.error && (
                <div className="text-center text-red-600">
                  Error al cargar los profesionales
                </div>
              )}

              {sqlProfessionals.data && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-1 gap-6"
                >
                  {sqlProfessionals.data.map((professional, index) => (
                    <motion.div
                      key={professional.ProfessionalID}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border border-blue-200"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <motion.h3
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="text-2xl font-bold text-gray-800 flex items-center gap-2"
                          >
                            <User className="h-6 w-6 text-blue-500" />
                            {professional.FirstName}
                          </motion.h3>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                            className="flex items-center gap-2"
                          >
                            <span className="text-lg font-bold text-blue-600">
                              {professional.TotalNominations} Nominaciones
                            </span>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalNoAward;
