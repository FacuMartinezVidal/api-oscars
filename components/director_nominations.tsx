"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Award } from "lucide-react";
import { motion } from "framer-motion";

const DirectorNominations = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [shouldFetch, setShouldFetch] = useState(false);

  const director = trpc.mongo.getDirectorNominations.useQuery(
    {
      searchTerm,
    },
    {
      enabled: shouldFetch,
    }
  );

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setShouldFetch(true);
    }
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">
            Nominaciones de Director
          </h1>

          {/* Search input */}
          <div className="mb-8">
            <div className="flex gap-4 mb-4">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre del director"
                className="flex-1"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              Buscar
            </Button>
          </div>

          {/* Loading state */}
          {director.isFetching && (
            <div className="text-center text-gray-600">
              <Loader2 className="mx-auto h-8 w-8 animate-spin" />
              <p className="mt-2">Buscando director...</p>
            </div>
          )}

          {/* Error state */}
          {director.error && (
            <div className="text-center text-red-600">
              Error al buscar el director: {director.error.message}
            </div>
          )}

          {/* Director info */}
          {director.data && director.data.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {director.data.map((dir, index) => (
                <motion.div
                  key={dir.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg overflow-hidden shadow-lg border border-orange-200 p-8 mb-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="flex items-center gap-4"
                    >
                      <Award className="h-12 w-12 text-orange-500" />
                      <h2 className="text-3xl font-bold text-gray-800">
                        {dir.director}
                      </h2>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      className="bg-orange-100 px-6 py-3 rounded-full"
                    >
                      <span className="text-2xl font-bold text-orange-600">
                        {dir.nominationsCount} Nominaciones
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dir.nominations.map((nomination, nominationIndex) => (
                        <motion.div
                          key={nominationIndex}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            duration: 0.2,
                            delay: 0.5 + nominationIndex * 0.1,
                          }}
                          className="p-4 bg-white rounded-lg border border-orange-100"
                        >
                          <div className="flex flex-col gap-2">
                            <span className="font-medium text-orange-700">
                              {nomination.movie}
                            </span>
                            <span className="text-sm text-gray-600">
                              {nomination.category}
                            </span>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">
                                {nomination.year}
                              </span>
                              <span
                                className={`font-medium ${
                                  nomination.result === "Winner"
                                    ? "text-green-600"
                                    : "text-gray-600"
                                }`}
                              >
                                {nomination.result}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Empty state */}
          {director.data &&
            director.data.length === 0 &&
            !director.isFetching && (
              <div className="text-center text-gray-600 mt-4">
                No se encontraron nominaciones para este director
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DirectorNominations;
