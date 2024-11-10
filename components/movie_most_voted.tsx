"use client";

import { trpc } from "@/utils/trpc";
import { Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MovieData {
  movie: string;
  voteDate: string;
  votes: number | null;
}

const MovieMostVoted = () => {
  const mongoMovie = trpc.mongo.getMostVotedMovie.useQuery();
  const cassandraMovie = trpc.cassandra.get_movies_by_votes.useQuery();
  const sqlMovie = trpc.sql.getMoviesMostVotedAndLeastVoted.useQuery();

  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">
            Películas Más y Menos Votadas
          </h1>

          <Tabs defaultValue="mongodb" className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="mongodb">MongoDB</TabsTrigger>
              <TabsTrigger value="cassandra">Cassandra</TabsTrigger>
              <TabsTrigger value="sql">SQL</TabsTrigger>
            </TabsList>

            <TabsContent value="mongodb">
              {mongoMovie.error && <ErrorState />}
              {mongoMovie.data && (
                <MovieCards
                  mostVoted={{
                    movie: mongoMovie.data.mostVoted.movie,
                    voteDate: new Date().toISOString(),
                    votes: mongoMovie.data.mostVoted.votes,
                  }}
                  leastVoted={{
                    movie: mongoMovie.data.leastVoted.movie,
                    voteDate: new Date().toISOString(),
                    votes: mongoMovie.data.leastVoted.votes,
                  }}
                />
              )}
            </TabsContent>

            <TabsContent value="cassandra">
              {cassandraMovie.error && <ErrorState />}
              {cassandraMovie.data && (
                <MovieCards
                  mostVoted={{
                    movie:
                      cassandraMovie.data.movies_most_voted[0]?.movie_name ||
                      "",
                    voteDate: new Date().toISOString(),
                    votes: cassandraMovie.data.movies_most_voted[0]?.votes || 0,
                  }}
                  leastVoted={{
                    movie:
                      cassandraMovie.data.movies_least_voted[0]?.movie_name ||
                      "",
                    voteDate: new Date().toISOString(),
                    votes:
                      cassandraMovie.data.movies_least_voted[0]?.votes || 0,
                  }}
                />
              )}
            </TabsContent>

            <TabsContent value="sql">
              {sqlMovie.error && <ErrorState />}
              {sqlMovie.data && (
                <MovieCards
                  mostVoted={{
                    movie: sqlMovie.data.mostVoted[0]?.Title || "",
                    voteDate: new Date().toISOString(),
                    votes: sqlMovie.data.mostVoted[0]?.TotalVotes || 0,
                  }}
                  leastVoted={{
                    movie: sqlMovie.data.leastVoted[0]?.Title || "",
                    voteDate: new Date().toISOString(),
                    votes: sqlMovie.data.leastVoted[0]?.TotalVotes || 0,
                  }}
                />
              )}
            </TabsContent>
          </Tabs>

          {/* Empty state */}
          {!mongoMovie.data &&
            !mongoMovie.isFetching &&
            !mongoMovie.error &&
            !cassandraMovie.data &&
            !cassandraMovie.isFetching &&
            !cassandraMovie.error &&
            !sqlMovie.data &&
            !sqlMovie.isFetching &&
            !sqlMovie.error && (
              <div className="text-center text-gray-600 mt-4">
                No se encontró información de las películas
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

const ErrorState = () => (
  <div className="text-center text-red-600">Error al cargar las películas</div>
);

const MovieCards = ({
  mostVoted,
  leastVoted,
}: {
  mostVoted: MovieData;
  leastVoted: MovieData;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
    className="space-y-8"
  >
    <MovieCard
      title="Película Más Votada"
      movie={mostVoted}
      icon={<ThumbsUp className="h-12 w-12 text-teal-500" />}
      gradientColors="from-teal-50 to-cyan-50"
      borderColor="border-teal-200"
      voteColor="text-teal-600"
      bgColor="bg-teal-100"
    />
    <MovieCard
      title="Película Menos Votada"
      movie={leastVoted}
      icon={<ThumbsDown className="h-12 w-12 text-red-500" />}
      gradientColors="from-red-50 to-pink-50"
      borderColor="border-red-200"
      voteColor="text-red-600"
      bgColor="bg-red-100"
    />
  </motion.div>
);

const MovieCard = ({
  title,
  movie,
  icon,
  gradientColors,
  borderColor,
  voteColor,
  bgColor,
}: {
  title: string;
  movie: {
    movie: string;
    voteDate: string;
    votes: number | null;
  };
  icon: React.ReactNode;
  gradientColors: string;
  borderColor: string;
  voteColor: string;
  bgColor: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`bg-gradient-to-r ${gradientColors} rounded-lg overflow-hidden shadow-lg ${borderColor} border p-8`}
  >
    <h3 className="text-2xl font-bold mb-4 text-gray-800">{title}</h3>
    <div className="flex items-center justify-between mb-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex items-center gap-4"
      >
        {icon}
        <div>
          <h2 className="text-3xl font-bold text-gray-800">{movie.movie}</h2>
          <p className="text-gray-600">
            Fecha de Votación:{" "}
            {new Date(movie.voteDate).toLocaleDateString("es-ES", {
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
        className={`flex items-center gap-2 ${bgColor} px-6 py-3 rounded-full`}
      >
        <span className={`text-2xl font-bold ${voteColor}`}>
          {movie.votes ?? 0} Votos
        </span>
      </motion.div>
    </div>
  </motion.div>
);

export default MovieMostVoted;
