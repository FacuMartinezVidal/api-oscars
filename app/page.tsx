"use client";

import MovieNominations from "@/components/movie_nominations";
import MovieAwards from "@/components/movie_awards";
import MovieMostAwarded from "@/components/movie_most_awarded";
import ProfessionalNoAward from "@/components/professional_no_award";
import ActorMostAwarded from "@/components/actor_most_awarded";
import MovieMostVoted from "@/components/movie_most_voted";
import DirectorNominations from "@/components/director_nominations";
import AdminPanel from "@/components/admin_panel";
import { useState } from "react";

export default function Home() {
  return (
    <div className="relative flex flex-col gap-8 bg-gradient-to-b from-gray-100 to-gray-200">
      <AdminPanel />
      <MovieNominations />
      <ActorMostAwarded />
      <MovieMostAwarded />
      <DirectorNominations />
      <MovieAwards />
      <ProfessionalNoAward />
      <MovieMostVoted />
    </div>
  );
}
