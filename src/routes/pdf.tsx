import {  callLlmWithQuery, uploadPdf } from '@/data/demo.punk-songs';
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState, useRef, useEffect} from 'react';
import {useMutation} from "@tanstack/react-query"
import { supabase } from '@/lib/supabase';
import { useNavigate } from "@tanstack/react-router";
import { PDFParse } from 'pdf-parse';
// import { getPath, getData } from 'pdf-parse/worker';

export const Route = createFileRoute('/pdf')({
    component: RouteComponent,
    beforeLoad: async ({ location }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw redirect({
                to: '/',
                search: { redirect: location.href }
            })
        }
        // user to child routes
        return {user}
    }
})

function RouteComponent() {
  const { user } = Route.useRouteContext()
  // const user_Id = user.id
  // add loader or error will be thrown saying cant read property of id
  // console.log("/pdf user_Id:", user?.id)
  const [response, setResponse] = useState("");
  const [llmResponse, setLlmResponse] = useState("");
  const [userId, setUserId] = useState<string | null >(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();
  

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id || null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);


  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      return await callLlmWithQuery({data: message});
    },
    onSuccess: (data) => {
      setLlmResponse(data);
    }
  });

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return alert(error.message);
    navigate({ to: "/" })
  };

  return (
   
   <div className="min-h-screen bg-gray-50">
  <div className="px-4 pt-6">
    <div className="max-w-6xl mx-auto">

      {/* ================= TOP BAR ================= */}
      <div className="flex flex-col sm:flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        {/* MOBILE LOGOUT: top-right */}
        <div className="flex justify-end lg:hidden">
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* LEFT: Upload + Question */}
        <div className="
          flex flex-col sm:flex-col lg:flex-row lg:items-center w-full gap-3 sm:gap-4
          bg-white sm:bg-transparent
          p-4 sm:p-0
          rounded-lg sm:rounded-none
          shadow sm:shadow-none
          transition-transform duration-200 ease-in-out
          hover:shadow-lg hover:-translate-y-0.5
        ">
          {/* File upload */}
          <form
            ref={formRef}
            onSubmit={async (e) => {
              e.preventDefault();
              setPdfUploading(true);

              const fd = new FormData(e.currentTarget);
              const pdfFile = fd.get("file");

              if (!pdfFile || !(pdfFile instanceof File)) {
                throw new Error("Invalid file!");
              }

              const pdfBuffer = await pdfFile.arrayBuffer();
              PDFParse.setWorker(
                "https://cdn.jsdelivr.net/npm/pdf-parse@latest/dist/pdf-parse/web/pdf.worker.mjs"
              );
              const pdfParser = new PDFParse({ data: pdfBuffer });
              const pdfContent = (await pdfParser.getText()).text;

              fd.append("userId", userId ?? "");
              fd.append("pdfContent", pdfContent ?? "");

              const res = await uploadPdf({ data: fd });
              setResponse(res.message);

              setPdfUploading(false);
              formRef.current?.reset();
            }}
            encType="multipart/form-data"
            className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto"
          >
            <input
              type="file"
              name="file"
              accept="application/pdf"
              required
              className="w-full sm:w-56 text-sm border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-400 transition"
            />
            <button
              type="submit"
              disabled={pdfUploading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {pdfUploading ? "Uploading…" : "Upload"}
            </button>
          </form>

          {/* Question input */}
          <input
            type="text"
            placeholder="Ask a question…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full sm:w-[360px] text-sm border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-indigo-400 transition"
          />

          {/* Ask button */}
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full sm:w-auto px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {mutation.isPending ? "Searching…" : "Ask"}
          </button>
        </div>

        {/* DESKTOP LOGOUT: inline right */}
        <div className="hidden lg:flex justify-end">
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* ================= RESPONSE AREA ================= */}
      {(response || llmResponse) && (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white shadow">
          {/* Header */}
          <div className="px-4 py-2 border-b bg-gray-100 rounded-t-xl">
            <p className="text-sm font-semibold text-gray-700">Response</p>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
            {response && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                {response}
              </div>
            )}
            {llmResponse && (
              <div className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                {llmResponse}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
</div>
    )}
