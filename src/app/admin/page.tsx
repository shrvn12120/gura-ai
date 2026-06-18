// src/app/admin/page.tsx

export default function AdminHome() {
  return (
    <div>
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <Card title="Listings" value="--" />
        <Card title="Active" value="--" />
        <Card title="Island" value="Guraidhoo" />
      </div>
    </div>
  );
}

function Card({ title, value }: any) {
  return (
    <div className="border rounded-lg p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}