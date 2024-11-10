interface movies_by_category {
  movie: string;
  year: number;
  nominations: string[];
  genre: string;
  synopsis: string;
}

interface nominations_by_actor {
  award: string;
  year: number;
}

interface awards_by_actor {
  actor_name: string;
  birthdate: Date;
  awards_won: number;
  nominations: nominations_by_actor[];
}

interface awards_by_movie {
  movie: string;
  synopsis: string;
  category: string[];
  year: number;
  awards_won: number;
}

interface nominations_by_movie {
  movie: string;
  category: string;
}

interface nominations_by_director {
  director_name: string;
  nominations: nominations_by_movie[];
  nominations_count: number;
}

interface nominations_by_awards {
  category: string;
  result: string;
}

interface movies_by_nominations_count {
  movie_name: string;
  synopsis: string;
  year: number;
  genre: string;
  nominations_count: number;
}

interface movies_by_votes_category {
  movie_name: string;
  synopsis: string;
  votes: number;
  category: string;
}

interface actors_awards {
  first_name: string;
  last_name: string;
  nationality: string;
  has_won_awards: boolean;
  nominations: number;
  nominations_categories: string[];
}
