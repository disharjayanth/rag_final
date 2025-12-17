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
    
  <div className="min-h-screen bg-white flex items-center justify-center p-6">
<button
  onClick={handleLogout}
  className="
    absolute top-4 right-4
    px-4 py-2
    bg-red-500 text-white text-sm font-semibold
    rounded-lg
    hover:bg-red-600 transition
    active:scale-95
    shadow
  "
>
  Logout
</button>

<div className="relative w-full max-w-2xl p-8 rounded-2xl shadow-xl border border-gray-200 bg-white backdrop-blur-xl">

      {/* <h1 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
        PDF Upload & LLM Query
      </h1> */}

      <div className="flex items-center justify-between mb-6">
  <h1 className="text-3xl font-semibold text-gray-800">
    PDF Upload & LLM Query
  </h1>
  
</div>

      {/* PDF Upload Form */}
      <form
        ref={formRef}
        onSubmit={async (e) => {
          e.preventDefault();
          setPdfUploading(true)
          const fd = new FormData(e.currentTarget);
          const pdfFile = fd.get("file")
          if (!pdfFile || !(pdfFile instanceof File)) {
               throw new Error("Invalid file!");
          }

          const pdfBuffer = await pdfFile.arrayBuffer()
          // PDFParse.setWorker(getData());
          PDFParse.setWorker('https://cdn.jsdelivr.net/npm/pdf-parse@latest/dist/pdf-parse/web/pdf.worker.mjs');
          const pdfParser = new PDFParse({data: pdfBuffer })
          const pdfContent = (await pdfParser.getText()).text;

          fd.append("userId", userId ?? "");
          fd.append("pdfContent", pdfContent ?? "")

          const res = await uploadPdf({ data: fd });
          setResponse(res.message);
           
          setPdfUploading(false)
          formRef.current?.reset();
        }}

        encType="multipart/form-data"
        className="space-y-4"
      >
        <label className="block">
          <span className="text-gray-700">Upload PDF</span>
          <input
            type="file"
            name="file"
            accept="application/pdf"
            required
            className="
              mt-2 w-full bg-gray-50 border border-gray-300 rounded-xl p-2 
              text-gray-700 
              file:bg-gray-200 file:text-gray-700 file:rounded-lg file:px-4 file:py-2 
              file:border file:border-gray-300
              hover:bg-gray-100 transition
            "
          />
        </label>

        <button
         type="submit"
         disabled={pdfUploading}
         className={`w-full py-3 rounded-xl text-white font-semibold 
              ${pdfUploading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"} 
              transition active:scale-95 shadow-md`}
        >
          {pdfUploading ? "Uploading..." : "Upload"}
        </button>

        {response && (
          <p className="text-green-600 text-center font-medium">{response}</p>
        )}
      </form>

      {/* Divider */}
      <div className="my-8 border-t border-gray-200" />

      {/* LLM Query */}
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Type your question..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="
            w-full bg-gray-50 border border-gray-300 rounded-xl p-3 
            text-gray-800 placeholder-gray-400 
            focus:ring-2 focus:ring-blue-400 focus:border-blue-400 
            transition
          "
        />

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="
            w-full py-3 rounded-xl text-white font-semibold 
            bg-indigo-500 hover:bg-indigo-600 
            transition active:scale-95 
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {mutation.isPending ? "Searching..." : "Ask Question"}
        </button>

        {llmResponse && (
          <p className="text-gray-700 bg-gray-50 p-4 border border-gray-300 rounded-xl whitespace-pre-line shadow-sm">
            {llmResponse}
          </p>
        )}
      </div>
    </div>
  </div>
)

}
