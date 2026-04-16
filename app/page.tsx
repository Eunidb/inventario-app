import { supabase } from "@/lib/supabase"

export default async function Home() {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">usuarios</h1>

      {data?.map((item) => (
        <div key={item.id} className="border p-2 mt-2">
          {item.nombre}
        </div>
      ))}
    </div>
  )
}