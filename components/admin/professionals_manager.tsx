"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ProfessionalsManager = () => {
  const [selectedDb, setSelectedDb] = useState<"sql" | "mongo" | "cassandra">(
    "sql"
  );
  const [isOpen, setIsOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    nationality: "",
    birthDate: "",
  });

  const {
    data: sqlProfessionals,
    refetch: refetchSql,
    isLoading: isSqlLoading,
  } = trpc.sql.getAllProfessionals.useQuery(undefined, {
    enabled: selectedDb === "sql",
  });

  const {
    data: mongoProfessionals,
    refetch: refetchMongo,
    isLoading: isMongoLoading,
  } = trpc.mongo.getProfessionals.useQuery(undefined, {
    enabled: selectedDb === "mongo",
  });

  const {
    data: cassandraProfessionals,
    refetch: refetchCassandra,
    isLoading: isCassandraLoading,
  } = trpc.cassandra.getAllProfessionals.useQuery(undefined, {
    enabled: selectedDb === "cassandra",
  });

  const sqlInsertMutation = trpc.sql.insertProfessional.useMutation();
  const sqlUpdateMutation = trpc.sql.updateProfessional.useMutation();
  const sqlDeleteMutation = trpc.sql.deleteProfessional.useMutation();

  const mongoInsertMutation = trpc.mongo.insertProfessional.useMutation();
  const mongoUpdateMutation = trpc.mongo.updateProfessional.useMutation();
  const mongoDeleteMutation = trpc.mongo.deleteProfessional.useMutation();

  const cassandraInsertMutation =
    trpc.cassandra.insertProfessional.useMutation();
  const cassandraUpdateMutation =
    trpc.cassandra.updateProfessional.useMutation();
  const cassandraDeleteMutation =
    trpc.cassandra.deleteProfessional.useMutation();

  const handleSubmit = async () => {
    try {
      if (editingProfessional) {
        switch (selectedDb) {
          case "sql":
            await sqlUpdateMutation.mutateAsync({
              professionalId: editingProfessional.ProfessionalID,
              ...formData,
            });
            refetchSql();
            break;
          case "mongo":
            await mongoUpdateMutation.mutateAsync({
              id: editingProfessional.id,
              ...formData,
            });
            refetchMongo();
            break;
          case "cassandra":
            await cassandraUpdateMutation.mutateAsync({
              id: editingProfessional.id,
              ...formData,
            });
            refetchCassandra();
            break;
        }
      } else {
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
            await cassandraInsertMutation.mutateAsync(formData);
            refetchCassandra();
            break;
        }
      }
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving professional:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      nationality: "",
      birthDate: "",
    });
    setEditingProfessional(null);
    setIsOpen(false);
  };

  const isLoading = useMemo(() => {
    switch (selectedDb) {
      case "sql":
        return isSqlLoading;
      case "mongo":
        return isMongoLoading;
      case "cassandra":
        return isCassandraLoading;
      default:
        return false;
    }
  }, [selectedDb, isSqlLoading, isMongoLoading, isCassandraLoading]);

  const isMutating = useMemo(() => {
    return (
      sqlInsertMutation.isLoading ||
      sqlUpdateMutation.isLoading ||
      sqlDeleteMutation.isLoading ||
      mongoInsertMutation.isLoading ||
      mongoUpdateMutation.isLoading ||
      mongoDeleteMutation.isLoading ||
      cassandraInsertMutation.isLoading ||
      cassandraUpdateMutation.isLoading ||
      cassandraDeleteMutation.isLoading
    );
  }, [
    sqlInsertMutation.isLoading,
    sqlUpdateMutation.isLoading,
    sqlDeleteMutation.isLoading,
    mongoInsertMutation.isLoading,
    mongoUpdateMutation.isLoading,
    mongoDeleteMutation.isLoading,
    cassandraInsertMutation.isLoading,
    cassandraUpdateMutation.isLoading,
    cassandraDeleteMutation.isLoading,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestión de Profesionales</h2>
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

          <Button
            onClick={() => {
              resetForm();
              setEditingProfessional(null);
              setIsOpen(true);
            }}
            disabled={isLoading || isMutating}
          >
            {isMutating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Agregar Profesional
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {selectedDb === "sql" &&
            sqlProfessionals?.map((professional) => (
              <div
                key={professional.ProfessionalID}
                className="p-4 border rounded-lg flex justify-between items-center"
              >
                <div>
                  <h3 className="font-medium">
                    {professional.FirstName} {professional.LastName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {professional.BirthDate
                      ? format(new Date(professional.BirthDate), "dd/MM/yyyy")
                      : "No date"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingProfessional(professional);
                      setFormData({
                        firstName: professional.FirstName ?? "",
                        lastName: professional.LastName ?? "",
                        nationality: "",
                        birthDate: professional.BirthDate
                          ? format(
                              new Date(professional.BirthDate),
                              "yyyy-MM-dd"
                            )
                          : "",
                      });
                      setIsOpen(true);
                    }}
                    disabled={isMutating}
                  >
                    {sqlUpdateMutation.isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Pencil className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      await sqlDeleteMutation.mutateAsync({
                        professionalId: professional.ProfessionalID,
                      });
                      refetchSql();
                    }}
                    disabled={isMutating}
                  >
                    {sqlDeleteMutation.isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}

          {selectedDb === "mongo" &&
            mongoProfessionals?.map((professional) => (
              <div
                key={professional.id}
                className="p-4 border rounded-lg flex justify-between items-center"
              >
                <div>
                  <h3 className="font-medium">
                    {professional.firstName} {professional.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {professional.dateOfBirth
                      ? format(new Date(professional.dateOfBirth), "dd/MM/yyyy")
                      : "No date"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingProfessional(professional);
                      setFormData({
                        firstName: professional.firstName ?? "",
                        lastName: professional.lastName ?? "",
                        nationality: "",
                        birthDate: professional.dateOfBirth
                          ? format(
                              new Date(professional.dateOfBirth),
                              "yyyy-MM-dd"
                            )
                          : "",
                      });
                      setIsOpen(true);
                    }}
                    disabled={isMutating}
                  >
                    {mongoUpdateMutation.isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Pencil className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      await mongoDeleteMutation.mutateAsync({
                        id: professional.id,
                      });
                      refetchMongo();
                    }}
                    disabled={isMutating}
                  >
                    {mongoDeleteMutation.isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}

          {selectedDb === "cassandra" &&
            cassandraProfessionals?.map((professional: any) => (
              <div
                key={professional.id}
                className="p-4 border rounded-lg flex justify-between items-center"
              >
                <div>
                  <h3 className="font-medium">
                    {professional.firstName} {professional.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {professional.birthDate
                      ? format(new Date(professional.birthDate), "dd/MM/yyyy")
                      : "No date"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Awards: {professional.awardsWon} | Nominations:{" "}
                    {professional.nominations?.length || 0}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingProfessional(professional);
                      setFormData({
                        firstName: professional.firstName ?? "",
                        lastName: professional.lastName ?? "",
                        nationality: "",
                        birthDate: professional.birthDate
                          ? format(
                              new Date(professional.birthDate),
                              "yyyy-MM-dd"
                            )
                          : "",
                      });
                      setIsOpen(true);
                    }}
                    disabled={isMutating}
                  >
                    {cassandraUpdateMutation.isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Pencil className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      await cassandraDeleteMutation.mutateAsync({
                        id: professional.id,
                      });
                      refetchCassandra();
                    }}
                    disabled={isMutating}
                  >
                    {cassandraDeleteMutation.isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProfessional
                ? "Editar Profesional"
                : "Agregar Profesional"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Apellido</label>
              <Input
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Nacionalidad</label>
              <Input
                value={formData.nationality}
                onChange={(e) =>
                  setFormData({ ...formData, nationality: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Fecha de Nacimiento</label>
              <Input
                type="date"
                value={formData.birthDate}
                onChange={(e) =>
                  setFormData({ ...formData, birthDate: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isMutating}>
                {isMutating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  "Guardar"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfessionalsManager;
