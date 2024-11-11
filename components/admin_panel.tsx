"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MoviesManager from "@/components/admin/movies_manager";
import ProfessionalsManager from "./admin/professionals_manager";

const AdminPanel = () => {
  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Panel de Administración</h1>

      <Tabs defaultValue="movies" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="movies">Películas</TabsTrigger>
          <TabsTrigger value="professionals">Profesionales</TabsTrigger>
        </TabsList>

        <TabsContent value="movies">
          <MoviesManager />
        </TabsContent>
        <TabsContent value="professionals">
          <ProfessionalsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
