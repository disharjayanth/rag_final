// import { pool } from "@/server/db";
import {  createVectorStoreForSupaBase } from './embeddings';
import {createClient} from "@supabase/supabase-js"

// import { CanvasFactory } from 'pdf-parse/worker';
// import { PDFParse } from 'pdf-parse';
// import { getPath, getData } from 'pdf-parse/worker';

const supabase = createClient(String(process.env.YOUR_PROJECT_URL), String(process.env.YOUR_SUPABASE_API_KEY))
console.log(process.env.YOUR_PROJECT_URL, process.env.YOUR_SUPABASE_API_KEY)


// export function chunkText(text: string, sieze = 2000) {
//     const chunks: string[] = []
//     for (let i = 0; i < text.length; i = i + 2000) {
//         chunks.push(text.slice(i, i + sieze))
//     }
//     return chunks
// }

// 2000 chars in single chunk meaning google may divide and create subrequests and hence error
export function chunkText(
  text: string,
  size = 700,
  maxChunks = 40
) {
  const chunks: string[] = []
  let i = 0

  while (i < text.length && chunks.length < maxChunks) {
    chunks.push(text.slice(i, i + size))
    i += size
  }

  return chunks
}


// export async function loadPdf(filePath: string) {
//     const parser = new PDFParse({url: filePath})
//     const data = await parser.getText()

//     const queryDocId = `SELECT id FROM documents WHERE file_path= $1`;
//     const queryFilePath = filePath;
//     const documentId = await pool.query(queryDocId, [queryFilePath])

//     const document = {
//       documentId: documentId.rows[0].id ,
//       documentText: data.text 
//     }

//     return document
// }

// export async function savePdf(file: File, userId: any) {
export async function savePdf(file: File, userId: any, pdfContent: string) {
    console.log("user id:",userId)
    const pdfName =  file.name;
    // const pdfBuffer = await file.arrayBuffer();
    // PDFParse.setWorker(getPath());
    // or
    // PDFParse.setWorker(getData());
    // const pdfParser = new PDFParse({ data: pdfBuffer, CanvasFactory });
    // const pdfContent = (await pdfParser.getText()).text;

  //   const queryCheckDoc = `SELECT EXISTS (SELECT 1 FROM documents WHERE file_path = $1) AS EXISTS`;
  //   const checkDocValue = [pdfName];

  // try {
  //   const checkDocResult = await pool.query(queryCheckDoc, checkDocValue)
  //   if (checkDocResult.rows[0].exists) {
  //     console.log("File already present with same name and cannot be inserted.")
  //   } else {
  //     const queryInsertDoc = `INSERT INTO documents(title, file_path) VALUES ($1, $2) RETURNING *`;
  //     const insertDocValue = [pdfName, pdfName];
    
  //     try {
  //       const insertResult = await pool.query(queryInsertDoc, insertDocValue);
  //       console.log("Inserted documents: ", insertResult.rows[0].id)

  //       const chunks = chunkText(pdfContent)
  //       await createVectorStore(chunks, insertResult.rows[0].id)

  //     } catch (error) {
  //       console.log("Error while inserting document filename and filepath into documents table.", error)
  //     }
  //   }
  //   } catch (error) {
  //   console.log("Error checking if document exists with same file name.", error)
  // }

  //   const queryDocId = `SELECT id FROM documents WHERE title= $1`;
  //   const queryPdfName = pdfName;
  //   const documentId = await pool.query(queryDocId, [queryPdfName])

  if(file.type !== "application/pdf") {
    console.log("File is not pdf type");
    return "Please give pdf file only"
  }
    // SUPABASE CHECKING IF DOCUMENT TABLE HAS ALREADY FILE WITH SAME NAME IF IT DOES DONT INSERT FILE INTO STR OR DOC INTO DOCS TABLE
      const {count} = await supabase.from("documents")
      .select("*", { head: true, count: "exact"})
      .eq("title", pdfName)
      .eq("user_id", userId)
      console.log("No. of docs with same title name:", count)

      if (count! > 0) {
        console.log("PDF file is already present in storage and docs data in document table.")
        return "PDF file is already present in storage"
      } else {

        // SUPABASE DOCS AND FILE INSERTION
      async function uploadFileAndSaveDocsSupaBase(file: File, userId: any) {
      let { data: uploadData , error: uploadError } = await supabase.storage.from('rag_final').upload(`${userId}/${pdfName}`, file)
      if (uploadError) {
        console.log("error writing to supabase file storage:", uploadError)
      } else {
        console.log("Successfully written data to supabase:", uploadData)
      }

      // supabase FILE PDF STORAGE insertion
      let { data: docData, error: docError } = await supabase.from("documents")
      .insert({user_id: userId, title: pdfName, file_path: uploadData?.fullPath }).select("id").single();
      if (docError) {
        console.error("Error inserting document:", docError);
        return;
      }

      // const chunks = chunkText(pdfContent)
      
      // await createVectorStoreForSupaBase(chunks, docData?.id)

      const chunks = chunkText(pdfContent)

if (chunks.length > 40) {
  throw new Error("PDF too large for embedding")
}

// await createVectorStoreForSupaBase(chunks, docData?.id)

    try {
  await createVectorStoreForSupaBase(chunks, docData?.id)
} catch (err) {
  console.error("Embedding failed:", err)

  // Optional: mark document as failed
  await supabase
    .from("documents")
    .update({ embedding_status: "failed" })
    .eq("id", docData?.id)

  return "PDF uploaded, but embedding failed. Try smaller file."
}


   }

      await uploadFileAndSaveDocsSupaBase(file, userId);
}      

    return "PDF uploaded successfully"
}

export async function savePdfForDocumentation(file: File, userId: any, pdfContent: string) {
    console.log("user id:",userId)
    const pdfName =  file.name;
    // SUPABASE CHECKING IF DOCUMENT TABLE HAS ALREADY FILE WITH SAME NAME IF IT DOES DONT INSERT FILE INTO STR OR DOC INTO DOCS TABLE
      const {count} = await supabase.from("documents")
      .select("*", { head: true, count: "exact"})
      .eq("title", pdfName)
      .eq("user_id", userId)
      console.log("No. of docs with same title name:", count)

      if (count! > 0) {
        console.log("PDF file is already present in storage and docs data in document table.")
        return "PDF file is already present in storage"
      } else {

        // SUPABASE DOCS AND FILE INSERTION
      async function uploadFileAndSaveDocsSupaBase(file: File, userId: any) {
      let { data: uploadData , error: uploadError } = await supabase.storage.from('rag_final').upload(`${userId}/${pdfName}`, file)
      if (uploadError) {
        console.log("error writing to supabase file storage:", uploadError)
      } else {
        console.log("Successfully written data to supabase:", uploadData)
      }

      // supabase FILE PDF STORAGE insertion
      let { data: docData, error: docError } = await supabase.from("documents")
      .insert({user_id: userId, title: pdfName, file_path: uploadData?.fullPath }).select("id").single();
      if (docError) {
        console.error("Error inserting document:", docError);
        return;
      }

      const chunks = chunkText(pdfContent)

if (chunks.length > 40) {
  throw new Error("PDF too large for embedding")
}

  try {
  await createVectorStoreForSupaBase(chunks, docData?.id)
} catch (err) {
  console.error("Embedding failed:", err)

  // Optional: mark document as failed
  await supabase
    .from("documents")
    .update({ embedding_status: "failed" })
    .eq("id", docData?.id)

  return "PDF uploaded, but embedding failed. Try smaller file."
  }
}

  await uploadFileAndSaveDocsSupaBase(file, userId);

}      
    return "PDF uploaded successfully"
}