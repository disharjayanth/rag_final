export * from "./pdf";
export * from "./embeddings";
export * from "./llm";
export * from "./pdf";


// async function runRag(pdfPath: string, query: string) {
//   console.log("Loading PDF...");
//   const {documentId , documentText} = await loadPdf(pdfPath);

//   console.log("Splitting text...");
//   const chunks = chunkText(documentText);

//   console.log("Creating vector store...");
//   const store = await createVectorStore(chunks, documentId);

//   console.log("Searching relevant chunks...");
//   const topChunks = await retrieve(store, query);

//   console.log("Querying Gemini...");
//   const answer = await askWithContext(query, topChunks);

//   console.log("\nANSWER:\n", answer);
// }

// runRag("/Users/disharjayantha/Desktop/project/rag/List-of-Important-Inventions-Discoveries.pdf", "Who invented atom bomb and in which year?")
// runRag("/Users/disharjayantha/Desktop/project/rag/nke-10k-2023.pdf", "Name of the pdf and it's title?")
// runRag(
//   "/Users/disharjayantha/Desktop/project/rag/List-of-Important-Inventions-Discoveries.pdf", 
//   "List of all inventions between 1700 and 1800. How many inventions happend between these years?"
//   );