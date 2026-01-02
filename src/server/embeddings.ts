import { GoogleGenerativeAI  } from "@google/generative-ai";
// import { pool } from "./db";
import {createClient} from "@supabase/supabase-js"
// import dotenv from "dotenv";

// dotenv.config();
const supabase = createClient(String(process.env.YOUR_PROJECT_URL), String(process.env.YOUR_SUPABASE_API_KEY))
// console.log(process.env.YOUR_PROJECT_URL, process.env.YOUR_SUPABASE_API_KEY)

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is missing");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
export const embedder = genAI.getGenerativeModel({model: "text-embedding-004"})

export async function embed(text: string) {
    const result = await embedder.embedContent(text)
    return result.embedding.values
}

// export async function createVectorStore(chunks: string[], documentId: string) {
//     const store: {chunk: string; vector: number[]}[] = [];
//     const values: string[] = [];
//     const params: any[] = [];

//     let i = 1;

//     for (let [index,chunk] of chunks.entries()) {
//         const vector = await embed(chunk)
//         store.push({chunk, vector})
//         const vectorStor = `[${vector.join(',')}]`

//         values.push(`($${i++}, $${i++}, $${i++}, $${i++}::text::vector)`)
//         params.push(documentId, index, chunk, vectorStor)
//     }

//     // console.log(params)

//     const sql = `INSERT INTO chunk_embeddings (document_id, chunk_index, content, embeddings) VALUES ${values.join(",")}`;
//     await pool.query(sql, params);
//     return store
// }

export async function createVectorStoreForSupaBase(chunks: string[], documentId: string) {
    const rows = [];

    for (let [index, chunk] of chunks.entries()) {
        const vector = await embed(chunk);

        rows.push({
            document_id: documentId ,
            chunk_index: index ,
            content: chunk ,
            embeddings: vector
        });
    }

    const { error } = await supabase.from("chunk_embeddings").insert(rows);
    if (error) {
        console.error("Bulk supabase insertion error: ", error)
        throw error
    }

    // add throttle so that cloudflare doesnt cause subrequests
      await new Promise(r => setTimeout(r, 150))
}