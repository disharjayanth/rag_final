// import {pool} from "./db.ts";
import { embed } from "./embeddings.ts";
import { llm } from "./llm.ts";
import postgres from "postgres"

export async function retrieve(query: string, k=3) {
    const qVec = (await embed(query)).map(Number);

    const vectorStr = `[${qVec.join(',')}]`

    // const sql = `SELECT document_id, chunk_index, content, embeddings <-> $1 AS distance FROM chunk_embeddings ORDER BY embeddings <-> $1 LIMIT $2`;
    // const params = [vectorStr, k]; 
    // const result = await pool.query(sql, params);
    // console.log(result.rows)

    // console.log("database read:", await askWithContext(query, result.rows.map((r: any) => ( {text: r.content}))))

    // const llm_response = await askWithContext(query, result.rows.map((r: any) => ( {text: r.content})))

    const connectionString = process.env.SUPABASE_SQL_URL!;
    const supaBasePostGresSql = postgres(connectionString)
    console.log("connection string:",connectionString)
    const chunEmbed_SupaBase = await supaBasePostGresSql`SELECT content FROM chunk_embeddings ORDER BY embeddings <-> ${vectorStr} LIMIT ${k}`
    console.log(chunEmbed_SupaBase.flat().map((r: any) => ({text: r.content})))
    const supaBaseLLMResponse = await askWithContext(query, chunEmbed_SupaBase.flat().map((r: any) => ({text: r.content})))
    console.log("Result from supabase chunks LLM response:", supaBaseLLMResponse)

    return supaBaseLLMResponse
}

async function askWithContext(query: string, contextChunks: any) {
    const contextText = contextChunks.map((c: any) => c.text).join("\n\n")

    const prompt = `
    use ONLY the following context to answer.
    If answer not found in context, say "Not Found in PDF"

    CONTEXT:
    ${contextText}


    QUESTION:
    ${query}
    `;

    const result = await llm.generateContent(prompt)
    return result.response.text()
}