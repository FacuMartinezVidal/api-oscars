"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MoviesManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<any>(null);
  const [selectedDb, setSelectedDb] = useState<"sql" | "mongo" | "cassandra">(
    "sql"
  );
  const [cassandraUseCase, setCassandraUseCase] = useState<
    "category" | "awards" | "nominations" | "votes"
  >("category");
  const [formData, setFormData] = useState({
    title: "",
    year: new Date().getFullYear(),
    synopsis: "",
    genre: "",
  });

  // Reset states when changing database
  useEffect(() => {
    setEditingMovie(null);
    resetForm();
  }, [selectedDb]);

  // Reset states when changing Cassandra use case
  useEffect(() => {
    setEditingMovie(null);
    resetForm();
  }, [cassandraUseCase]);

  // Queries
  const {
    data: sqlMovies,
    refetch: refetchSql,
    isLoading: isSqlLoading,
  } = trpc.sql.getAllMovies.useQuery(undefined, {
    enabled: selectedDb === "sql",
  });

  const {
    data: mongoMovies,
    refetch: refetchMongo,
    isLoading: isMongoLoading,
  } = trpc.mongo.getMovies.useQuery(undefined, {
    enabled: selectedDb === "mongo",
  });

  const {
    data: cassandraMovies,
    refetch: refetchCassandra,
    isLoading: isCassandraLoading,
  } = trpc.cassandra.get_movies_by_category.useQuery(undefined, {
    enabled: selectedDb === "cassandra" && cassandraUseCase === "category",
  });

  const {
    data: cassandraMoviesAwards,
    refetch: refetchCassandraAwards,
    isLoading: isCassandraAwardsLoading,
  } = trpc.cassandra.get_movies_most_awarded.useQuery(undefined, {
    enabled: selectedDb === "cassandra" && cassandraUseCase === "awards",
  });

  const {
    data: cassandraMoviesNominations,
    refetch: refetchCassandraNominations,
    isLoading: isCassandraNominationsLoading,
  } = trpc.cassandra.get_movies_by_nominations_count.useQuery(undefined, {
    enabled: selectedDb === "cassandra" && cassandraUseCase === "nominations",
  });

  const {
    data: cassandraMoviesVotes,
    refetch: refetchCassandraVotes,
    isLoading: isCassandraVotesLoading,
  } = trpc.cassandra.get_movies_by_votes.useQuery(undefined, {
    enabled: selectedDb === "cassandra" && cassandraUseCase === "votes",
  });

  // Mutations
  const sqlInsertMutation = trpc.sql.insertMovie.useMutation();
  const sqlUpdateMutation = trpc.sql.updateMovie.useMutation();
  const sqlDeleteMutation = trpc.sql.deleteMovie.useMutation();

  const mongoInsertMutation = trpc.mongo.insertMovie.useMutation();
  const mongoUpdateMutation = trpc.mongo.updateMovie.useMutation();
  const mongoDeleteMutation = trpc.mongo.deleteMovie.useMutation();

  const cassandraInsertMutation = trpc.cassandra.insert_movie.useMutation();
  const cassandraUpdateMutation = trpc.cassandra.update_movie.useMutation();
  const cassandraDeleteMutation = trpc.cassandra.delete_movie.useMutation();

  const resetForm = () => {
    setFormData({
      title: "",
      year: new Date().getFullYear(),
      synopsis: "",
      genre: "",
    });
    setEditingMovie(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingMovie) {
        // Update existing movie
        switch (selectedDb) {
          case "sql":
            await sqlUpdateMutation.mutateAsync({
              id: editingMovie.id,
              ...formData,
            });
            refetchSql();
            break;
          case "mongo":
            await mongoUpdateMutation.mutateAsync({
              id: editingMovie.id,
              ...formData,
            });
            refetchMongo();
            break;
          case "cassandra":
            await cassandraUpdateMutation.mutateAsync({
              id: `${editingMovie.title}_${editingMovie.year}`,
              ...formData,
              useCase: cassandraUseCase,
            });
            refetchCassandra();
            refetchCassandraAwards();
            refetchCassandraNominations();
            refetchCassandraVotes();
            break;
        }
      } else {
        // Insert new movie
        switch (selectedDb) {
          case "sql":
            await sqlInsertMutation.mutateAsync(formData);
            refetchSql();
            break;
          case "mongo":
            await mongoInsertMutation.mutateAsync(formData);
            refetchMongo();
            break;
          case "cassandra":
            await cassandraInsertMutation.mutateAsync({
              ...formData,
              useCase: cassandraUseCase,
            });
            refetchCassandra();
            refetchCassandraAwards();
            refetchCassandraNominations();
            refetchCassandraVotes();
            break;
        }
      }
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving movie:", error);
    }
  };

  const handleDelete = async (movie: any) => {
    try {
      switch (selectedDb) {
        case "sql":
          await sqlDeleteMutation.mutateAsync({
            id: movie.id,
          });
          refetchSql();
          break;
        case "mongo":
          await mongoDeleteMutation.mutateAsync({
            id: movie.id, // Asegúrate de que este es el ID de MongoDB
          });
          refetchMongo();
          break;
        case "cassandra":
          await cassandraDeleteMutation.mutateAsync({
            id: `${movie.movie || movie.movie_name}_${movie.year}`,
            useCase: cassandraUseCase,
          });
          refetchCassandra();
          if (cassandraUseCase === "awards") refetchCassandraAwards();
          if (cassandraUseCase === "nominations") refetchCassandraNominations();
          if (cassandraUseCase === "votes") refetchCassandraVotes();
          break;
      }
    } catch (error) {
      console.error("Error deleting movie:", error);
    }
  };

  const isLoading = useMemo(() => {
    switch (selectedDb) {
      case "sql":
        return isSqlLoading;
      case "mongo":
        return isMongoLoading;
      case "cassandra":
        switch (cassandraUseCase) {
          case "category":
            return isCassandraLoading;
          case "awards":
            return isCassandraAwardsLoading;
          case "nominations":
            return isCassandraNominationsLoading;
          case "votes":
            return isCassandraVotesLoading;
          default:
            return false;
        }
      default:
        return false;
    }
  }, [
    selectedDb,
    cassandraUseCase,
    isSqlLoading,
    isMongoLoading,
    isCassandraLoading,
    isCassandraAwardsLoading,
    isCassandraNominationsLoading,
    isCassandraVotesLoading,
  ]);

  const currentMovies = useMemo(() => {
    switch (selectedDb) {
      case "sql":
        return (
          sqlMovies?.map((movie) => ({
            ...movie,
            id: movie.MovieID.toString(),
            title: movie.Title,
            year: movie.Year,
            synopsis: movie.Synopsis,
            genre: movie.Genre,
          })) || []
        );
      case "mongo":
        return (
          mongoMovies?.map((movie) => ({
            id: movie.id,
            title: movie.title,
            year: movie.year,
            synopsis: movie.synopsis,
            genre: movie.genre,
          })) || []
        );
      case "cassandra":
        switch (cassandraUseCase) {
          case "category":
            return (
              cassandraMovies?.map((row: any) => ({
                id: `${row.movie}_${row.year}`,
                title: row.movie,
                year: row.year,
                synopsis: row.synopsis || "",
                genre: row.genre || "",
                nominations: row.nominations || [],
              })) || []
            );
          case "awards":
            return (
              cassandraMoviesAwards?.map((row) => ({
                id: `${row.movie}_${row.year}`,
                title: row.movie,
                year: row.year,
                synopsis: row.synopsis || "",
                awards_won: row.awards_won,
                categories: row.category || [],
              })) || []
            );
          case "nominations":
            return (
              cassandraMoviesNominations?.map((row) => ({
                id: `${row.movie_name}_${row.year}`,
                title: row.movie_name,
                year: row.year,
                synopsis: row.synopsis || "",
                genre: row.genre || "",
                nominations_count: row.nominations_count,
              })) || []
            );
          case "votes":
            const mostVoted = cassandraMoviesVotes?.movies_most_voted || [];
            const leastVoted = cassandraMoviesVotes?.movies_least_voted || [];
            return [
              ...mostVoted.map((row) => ({
                id: `${row.movie_name}_${row.votes}`,
                title: row.movie_name,
                synopsis: row.synopsis || "",
                votes: row.votes,
                category: row.category,
                vote_type: "most_voted",
              })),
              ...leastVoted.map((row) => ({
                id: `${row.movie_name}_${row.votes}`,
                title: row.movie_name,
                synopsis: row.synopsis || "",
                votes: row.votes,
                category: row.category,
                vote_type: "least_voted",
              })),
            ];
          default:
            return [];
        }
      default:
        return [];
    }
  }, [selectedDb, sqlMovies, mongoMovies, cassandraMovies, cassandraUseCase]);

  const renderMovieCard = (movie: any) => {
    return (
      <div className="p-4 border rounded-lg flex justify-between items-center">
        <div>
          <h3 className="font-medium">{movie.title}</h3>
          <p className="text-sm text-gray-500">
            {movie.year} - {movie.genre}
          </p>
          <p className="text-sm">{movie.synopsis}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingMovie(movie);
              setFormData({
                title: movie.title,
                year: movie.year,
                synopsis: movie.synopsis || "",
                genre: movie.genre || "",
              });
              setIsOpen(true);
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(movie)}
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestión de Películas</h2>
        <div className="flex gap-4">
          <Select
            value={selectedDb}
            onValueChange={(value: any) => setSelectedDb(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Database" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sql">SQL</SelectItem>
              <SelectItem value="mongo">MongoDB</SelectItem>
              <SelectItem value="cassandra">Cassandra</SelectItem>
            </SelectContent>
          </Select>

          {selectedDb === "cassandra" && (
            <Select
              value={cassandraUseCase}
              onValueChange={(
                value: "category" | "awards" | "nominations" | "votes"
              ) => setCassandraUseCase(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Use Case" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category">By Category</SelectItem>
                <SelectItem value="awards">By Awards</SelectItem>
                <SelectItem value="nominations">By Nominations</SelectItem>
                <SelectItem value="votes">By Votes</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button
            onClick={() => {
              setEditingMovie(null);
              resetForm();
              setIsOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Movie
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {currentMovies.map((movie: any) => renderMovieCard(movie))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMovie ? "Edit Movie" : "Add New Movie"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Year</label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: parseInt(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Synopsis</label>
              <Textarea
                value={formData.synopsis}
                onChange={(e) =>
                  setFormData({ ...formData, synopsis: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Genre</label>
              <Input
                value={formData.genre}
                onChange={(e) =>
                  setFormData({ ...formData, genre: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MoviesManager;
