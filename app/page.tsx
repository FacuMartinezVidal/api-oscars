"use client";

import { useEffect } from "react";
import { trpc } from "@/utils/trpc";

export default function Home() {
  const hello = trpc.hello.greeting.useQuery({ name: "tRPC" });

  const createTest = trpc.test.createTest.useMutation();

  const handleCreateTest = () => {
    createTest.mutate({ name: "test" });
  };

  useEffect(() => {
    handleCreateTest();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Next.js + tRPC</h1>
        {hello.isLoading ? (
          <p>Loading...</p>
        ) : (
          <p className="text-lg">{hello.data?.greeting}</p>
        )}
      </div>
    </div>
  );
}
