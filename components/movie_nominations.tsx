"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const MovieNominations = () => {
  const [startYear, setStartYear] = useState("2020");
  const [endYear, setEndYear] = useState("2024");
  const [startYearError, setStartYearError] = useState("");
  const [endYearError, setEndYearError] = useState("");
  const [shouldFetch, setShouldFetch] = useState(false);

  const movies = trpc.mongo.getMoviesNominated.useQuery(
    {
      startYear: Number(startYear),
      endYear: Number(endYear),
    },
    {
      enabled: shouldFetch,
    }
  );

  const handleYearChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isStart: boolean
  ) => {
    const value = e.target.value;
    if (isStart) {
      setStartYear(value);
      setStartYearError(validateYear(value));
    } else {
      setEndYear(value);
      setEndYearError(validateYear(value));
    }
  };

  const validateYear = (year: string): string => {
    const numYear = Number(year);
    if (isNaN(numYear) || numYear < 1900 || numYear > 2024) {
      return "Por favor, ingrese un año válido entre 1900 y 2024.";
    }
    return "";
  };

  const handleSearch = () => {
    const startYearValidation = validateYear(startYear);
    const endYearValidation = validateYear(endYear);

    setStartYearError(startYearValidation);
    setEndYearError(endYearValidation);

    if (!startYearValidation && !endYearValidation) {
      if (Number(startYear) > Number(endYear)) {
        setEndYearError("El año final no puede ser menor que el año inicial.");
        return;
      }
      setShouldFetch(true);
    }
  };

  useEffect(() => {
    if (shouldFetch) {
      movies.refetch();
      setShouldFetch(false);
    }
  }, [shouldFetch, movies]);

  return (
    <div className=" py-12 px-4">
      <div className=" bg-white max-w-4xl mx-auto">
        <div className=" p-8 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">
            Películas Nominadas en Múltiples Categorías
          </h1>

          {/* Year inputs */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startYearInput"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Año inicial:
              </label>
              <Input
                id="startYearInput"
                type="text"
                value={startYear}
                onChange={(e) => handleYearChange(e, true)}
                className={startYearError ? "border-red-500" : ""}
              />
              {startYearError && (
                <p className="mt-1 text-sm text-red-600">{startYearError}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="endYearInput"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Año final:
              </label>
              <Input
                id="endYearInput"
                type="text"
                value={endYear}
                onChange={(e) => handleYearChange(e, false)}
                className={endYearError ? "border-red-500" : ""}
              />
              {endYearError && (
                <p className="mt-1 text-sm text-red-600">{endYearError}</p>
              )}
            </div>
          </div>

          {/* Search button */}
          <div className="mb-8">
            <Button
              onClick={handleSearch}
              className="w-full"
              disabled={movies.isFetching}
            >
              {movies.isFetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                "Buscar"
              )}
            </Button>
          </div>

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
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      className="text-sm text-gray-600 mb-3"
                    >
                      Año: {movie.year}
                    </motion.p>
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
                        Categorías Nominadas:
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
                            className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded"
                          >
                            {nomination.categoryId}
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
              No se encontraron películas
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieNominations;
