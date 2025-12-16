import {  savePdf } from '@/server/pdf'
import { retrieve } from '@/server/retrieve'
import { createServerFn } from '@tanstack/react-start'
// import { mkdir, writeFile } from 'fs/promises'
// import path from 'path'

export const getPunkSongs = createServerFn({
  method: 'GET',
}).handler(async () => [
  { id: 1, name: 'Teenage Dirtbag', artist: 'Wheatus' },
  { id: 2, name: 'Smells Like Teen Spirit', artist: 'Nirvana' },
  { id: 3, name: 'The Middle', artist: 'Jimmy Eat World' },
  { id: 4, name: 'My Own Worst Enemy', artist: 'Lit' },
  { id: 5, name: 'Fat Lip', artist: 'Sum 41' },
  { id: 6, name: 'All the Small Things', artist: 'blink-182' },
  { id: 7, name: 'Beverly Hills', artist: 'Weezer' },
])

// export const callloadPdf = createServerFn({method: "GET"})
// .inputValidator((data: string ) => data)
// .handler(async({ data }) => {
//   const response = await loadPdf(data)
//   return response
// })

export const callLlmWithQuery = createServerFn({method: "POST"})
.inputValidator((data: string) => data)
.handler(async({ data }) => {
  const response = await retrieve(data, 2)
  return response
})

export const uploadPdf = createServerFn({method: "POST"})
.inputValidator((formData: FormData) => {
  const file = formData.get("file");
  const userId = formData.get("userId");
  const pdfContent = formData.get("pdfContent")

  if (!file || !(file instanceof File)) {
    throw new Error("Invalid file!");
  }
  if (!pdfContent || typeof pdfContent !== "string") {
  throw new Error("Invalid or missing userId");
  }

  return {file, userId, pdfContent}
  // return {file, userId}
})
.handler(async({ data: {file, userId, pdfContent} }) => {
// .handler(async({ data: {file, userId} }) => {
  const response = await savePdf(file, userId, pdfContent)
  // const response = await savePdf(file, userId)

  return {
    message: "PDF uploaded successfully",
    response
  }
})

