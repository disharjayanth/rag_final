CREATE TABLE documents(id SERIAL PRIMARY KEY, title TEXT, file_path TEXT, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE chunk_embeddings(id SERIAL PRIMARY KEY, document_id INT REFERENCES documents(id) ON DELETE CASCADE, chunk_index INT, content TEXT, embeddings VECTOR(768), created_at TIMESTAMP DEFAULT NOW());

CREATE TABLE public.profiles ( id uuid NOT NULL, email text, created_at timestamp with time zone DEFAULT now(), CONSTRAINT profiles_pkey PRIMARY KEY (id), CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) );

