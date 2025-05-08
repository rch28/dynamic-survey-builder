import DatabaseInitializer from "@/components/database-initializer";

export default function DatabaseAdminPage() {
  return (
    <div className="p-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Database Administration</h1>
      <div className="grid gap-6">
        <DatabaseInitializer />
      </div>
    </div>
  );
}
