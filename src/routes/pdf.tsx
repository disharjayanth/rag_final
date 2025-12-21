import {  callLlmWithQuery, uploadPdf } from '@/data/demo.punk-songs';
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState, useRef, useEffect} from 'react';
import {useMutation} from "@tanstack/react-query"
import { supabase } from '@/lib/supabase';
import { useNavigate } from "@tanstack/react-router";
import { PDFParse } from 'pdf-parse';

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
  type Document = {
  id: string;
  user_id: string;
  title: string;
}

  const { user } = Route.useRouteContext()
  // const user_Id = user.id
  // add loader or error will be thrown saying cant read property of id
  // console.log("/pdf user_Id:", user?.id)
  const [response, setResponse] = useState("");
  const [llmResponse, setLlmResponse] = useState("");
  const [userId, setUserId] = useState<string | null >(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [userPdfs, setUserPdfs] = useState<Document[]>([]);
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);
  const [askLocked, setAskLocked] = useState(false);
  const [isLoadingPdfs, setIsLoadingPdfs] = useState(false);


  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();
  

  useEffect(() => {
    let { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id || null);
      }
    );

    return () => listener.subscription.unsubscribe();

  }, []);

  useEffect(() => {

    const fetchUserPdf = async () => {
      setIsLoadingPdfs(true);
      
      let { data: documents, error } = await supabase.from("documents").select("id, user_id, title").eq("user_id", userId)
      if (error != null) {
        setIsLoadingPdfs(false);
        console.log("error:", error)
        return
      }

      setUserPdfs(documents ?? [])
      setIsLoadingPdfs(false); 
    }

    if (userId!=null) {
      fetchUserPdf()
    }
    
  }, [selectedPdfId, userId])

  const [message, setMessage] = useState("");

  const mutation = useMutation({
  mutationFn: async ({
    message,
    pdfId,
  }: {
    message: string;
    pdfId: string;
  }) => {
    return await callLlmWithQuery({
      data: { message, pdfId },
    });
  },
  onSuccess: (data) => {
    setLlmResponse(data);
  },
   onSettled: () => {
    setAskLocked(false); 
  },
});


  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      navigate({ to: "/" }) 
      alert(error.message)
      return 
    };
    navigate({ to: "/" })
  };


const isAskDisabled =
  askLocked ||
  mutation.isPending ||
  !selectedPdfId ||
  message.trim().length === 0;

  return (
   
   <div className="min-h-screen bg-gray-50">
  <div className="px-4 pt-6">
    <div className="max-w-6xl mx-auto">

      {/* ================= TOP BAR ================= */}
      <div className="flex flex-col sm:flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3">

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
  flex flex-col sm:flex-col lg:flex-row lg:items-center w-full
  gap-3 sm:gap-4
  bg-white sm:bg-transparent
  p-6 sm:p-4
  rounded-lg sm:rounded-none
  shadow sm:shadow-none
  transition-all duration-200 ease-in-out
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
              setResponse(res.message!);

              setTimeout(() => {
                setResponse("");
              }, 4000)
              
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
  onClick={() => {
    if (!selectedPdfId) {
      alert("Please select a PDF first");
      return;
    }

    mutation.mutate({
      message,
      pdfId: selectedPdfId,
    });
  }}
  disabled={isAskDisabled}
  className={`
    px-4 py-2 rounded-lg text-sm font-medium transition
    ${
      isAskDisabled
        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
        : "bg-indigo-600 text-white hover:bg-indigo-700"
    }
      `}
>
  Ask
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
  {/* ================= USER PDF LIST ================= */}
<div className="mt-10 max-w-6xl mx-auto">
  <div className="max-h-[320px] overflow-y-auto divide-y">
      {isLoadingPdfs && (
  <div className="px-5 py-3">
    <div className="h-1 w-full overflow-hidden rounded bg-gray-200">
      <div className="h-full w-1/3 animate-pulse bg-indigo-500" />
    </div>
  </div>
)}
  </div>
  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
    
    <p className="px-5 py-2 text-sm text-gray-500 mt-1">
        <span className="font-bold">Select one PDF to query:</span>
    </p>

    {/* Header */}
    <div className="px-5 py-2 border-b bg-gradient-to-r from-gray-50 to-white">
      <h2 className="text-lg font-semibold text-gray-800">
        📄 Your PDFs
      </h2>
      <p className="text-sm text-gray-500 mt-1">
        Logged in as <span className="font-medium">{user.email}</span>
      </p>
    </div>

    {/* PDF List */}
    <div className="max-h-[320px] overflow-y-auto divide-y">
      {userPdfs.length === 0 && (
        <div className="px-5 py-6 text-sm text-gray-500 text-center">
          {isLoadingPdfs 
          ? 
          <div>
            Loading..
          </div> 
          : 
          <div>No PDFs uploaded yet</div>
          }
        </div>
      )}

      {userPdfs.map((pdf) => {
        const isSelected = selectedPdfId === pdf.id;

        return (
          <div
            key={pdf.id}
            onClick={() => setSelectedPdfId(pdf.id)}
            className={`
              px-5 py-3 cursor-pointer transition-all
              flex items-center justify-between
              ${isSelected
                ? "bg-indigo-50 border-l-4 border-indigo-500"
                : "hover:bg-gray-50"}
            `}
          >
            {/* Left */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`
                  h-9 w-9 flex items-center justify-center rounded-lg
                  ${isSelected ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-600"}
                `}
              >
                📘
              </div>

              <div className="min-w-0">
                <p
                  className={`
                    text-sm font-medium truncate
                    ${isSelected ? "text-indigo-700" : "text-gray-800"}
                  `}
                >
                  {pdf.title}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  ID: {pdf.id}
                </p>
              </div>
            </div>

            {/* Selected badge */}
            {isSelected && (
              <span className="text-xs font-semibold text-indigo-600">
                Selected
              </span>
            )}
          </div>
        );
      })}
    </div>
  </div>
</div>

</div>
    )}
