import SofiaAgent from './SofiaAgent.jsx'
import { supabase } from './lib/supabase'
import { useEffect, useState } from "react";

export default function App() {

  const [empresa, setEmpresa] = useState(null);

  useEffect(() => {
    async function loadCompanies() {
      const { data } = await supabase
        .from("companies")
        .select("*")
        .eq("slug", "inspire")
        .single();

      setEmpresa(data);
    }

    loadCompanies();
  }, []);

  if (!empresa) return <div>Carregando...</div>;

  return <SofiaAgent tenant={empresa} />
}