// Kunden-Dashboard mit Login, Rollen, Anrufübersicht, Statistiken und mehr

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://lqycbpavzjljdqaeiioq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxeWNicGF2empsamRxYWVpaW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MjQ3MDcsImV4cCI6MjA3MDAwMDcwN30.Jb2Uwxl_Dd-3ZY0r2fN3DWDe1GSqzx7BbE7fugIx7DE"
);

export default function Kundenbereich() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [calls, setCalls] = useState([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [role, setRole] = useState("user");

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        const { data: userData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        setRole(userData?.role || "user");
        fetchCalls(session.user.email);
      }
    };
    fetchUser();
  }, []);

  const fetchCalls = async (email) => {
    let query = supabase.from("calls").select("*").eq("user_email", email);

    if (fromDate) query = query.gte("created_at", fromDate);
    if (toDate) query = query.lte("created_at", toDate);

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });
    if (!error) setCalls(data || []);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const filteredCalls = calls.filter((call) =>
    call.phone.toLowerCase().includes(search.toLowerCase())
  );

  const erfolgsrate =
    calls.length > 0
      ? `${Math.round(
          (calls.filter((c) => c.transcript).length / calls.length) * 100
        )} %`
      : "0 %";

  const durchschnitt =
    calls.length > 0
      ? `${(
          calls.reduce((acc, cur) => acc + cur.duration, 0) / calls.length / 60
        ).toFixed(2)} min`
      : "0 min";

  return (
    <div className="p-4 bg-white min-h-screen dark:bg-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold dark:text-white">📞 Kunden-Dashboard</h1>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-1 rounded"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded">📞 Anrufe: {calls.length}</div>
        <div className="bg-green-100 p-4 rounded">✅ Erfolgsrate: {erfolgsrate}</div>
        <div className="bg-yellow-100 p-4 rounded">
          ⏱️ ⌀ Dauer: {durchschnitt}
        </div>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="🔍 Telefonnummer suchen"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border rounded w-full md:w-1/3"
        />
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="p-2 border rounded"
        />
        <button
          onClick={() => fetchCalls(user.email)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          🔄 Filtern
        </button>
      </div>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100 dark:bg-gray-800 dark:text-white">
          <tr>
            <th className="p-2 border">📅 Datum</th>
            <th className="p-2 border">📞 Telefon</th>
            <th className="p-2 border">🧾 Transkript</th>
            <th className="p-2 border">🔊 Audio</th>
            <th className="p-2 border">⭐ Qualität</th>
          </tr>
        </thead>
        <tbody>
          {filteredCalls.map((call) => (
            <tr key={call.id} className="border-t">
              <td className="p-2 border">
                {new Date(call.created_at).toLocaleString("de-DE")}
              </td>
              <td className="p-2 border">{call.phone}</td>
              <td className="p-2 border">
                {call.transcript || "(kein Transkript)"}
              </td>
              <td className="p-2 border">
                <audio controls src={call.audio_url}></audio>
              </td>
              <td className="p-2 border">
                {call.quality || "Unbekannt"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

