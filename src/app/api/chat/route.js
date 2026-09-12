import { Index } from "@upstash/vector";
import Groq from "groq-sdk";

// Inicializamos los clientes (leen las variables de entorno automáticamente
// gracias a los nombres UPSTASH_VECTOR_REST_URL / UPSTASH_VECTOR_REST_TOKEN)
const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request) {
  try {
    const { pregunta } = await request.json();

    if (!pregunta || pregunta.trim() === "") {
      return Response.json(
        { error: "No se recibió ninguna pregunta." },
        { status: 400 }
      );
    }

    // Paso 1: Buscar los chunks más relevantes en Upstash.
    // IMPORTANTE: como creamos el índice en modo "Custom" (nosotros generamos
    // los vectores en Python con all-MiniLM-L6-v2), aquí NO podemos mandar
    // texto crudo a Upstash para que lo vectorice él solo -- Upstash
    // necesita el VECTOR ya calculado con el mismo modelo. Usamos la API
    // gratuita de Hugging Face para generar ese vector de la pregunta.
    const preguntaVector = await embeberConHuggingFace(pregunta);

    const resultados = await index.query({
      vector: preguntaVector,
      topK: 3,
      includeMetadata: true,
    });

    const chunksEncontrados = resultados.map((r) => r.metadata.text);
    const contextosEncontrados = chunksEncontrados.join("\n\n");

    // Paso 2: Armar el mensaje y llamar a Groq (igual que tu script de Python)
    const mensaje = [
      {
        role: "system",
        content:
          "Eres un asistente de almacén mecatrónico. Responde SIEMPRE en español " +
          "y basándote ÚNICAMENTE en la información proporcionada en el contexto. " +
          "No utilices conocimientos externos ni inventes información. " +
          "Si la respuesta no se encuentra en el contexto, indica que no cuentas con el componente.",
      },
      {
        role: "user",
        content: `Contexto de inventario:\n${contextosEncontrados}\n\nPregunta: ${pregunta}`,
      },
    ];

    const respuesta = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: mensaje,
      max_tokens: 200,
      temperature: 0.7,
    });

    const respuestaTexto = respuesta.choices[0].message.content.trim();

    return Response.json({ respuesta: respuestaTexto });
  } catch (error) {
    console.error("Error en /api/chat:", error);
    return Response.json(
      { error: "Ocurrió un error procesando tu pregunta." },
      { status: 500 }
    );
  }
}

// Genera un embedding de 384 dimensiones usando la API gratuita de Hugging Face,
// con el mismo modelo que usaste en Python (all-MiniLM-L6-v2), para que sea
// compatible con los vectores que ya subiste a Upstash.
async function embeberConHuggingFace(texto) {
  const respuesta = await fetch(
    "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: texto,
        options: { wait_for_model: true },
      }),
    }
  );

  if (!respuesta.ok) {
    const errorTexto = await respuesta.text();
    throw new Error(`Error de Hugging Face: ${errorTexto}`);
  }

  const embedding = await respuesta.json();
  return embedding;
}