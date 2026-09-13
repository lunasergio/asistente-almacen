import { Index } from "@upstash/vector";
import Groq from "groq-sdk";
import { embeberTextos } from "@/lib/embeddings";

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

    // Convertimos la pregunta a vector (mandamos un arreglo de un solo
    // elemento porque embeberTextos siempre trabaja con arreglos)
    const [preguntaVector] = await embeberTextos([pregunta]);

    const resultados = await index.query({
      vector: preguntaVector,
      topK: 3,
      includeMetadata: true,
    });

    const chunksEncontrados = resultados.map((r) => r.metadata.text);
    const contextosEncontrados = chunksEncontrados.join("\n\n");

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