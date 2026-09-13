// Genera embeddings de 384 dimensiones usando la API gratuita de Hugging Face,
// con el mismo modelo que se usa para indexar (all-MiniLM-L6-v2).
// SIEMPRE recibe y regresa arreglos, para poder usarlo tanto con una sola
// pregunta como con muchas filas de un Excel a la vez (batching).
export async function embeberTextos(textos) {
  const respuesta = await fetch(
    "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: textos, // array de strings
        options: { wait_for_model: true },
      }),
    }
  );

  if (!respuesta.ok) {
    const errorTexto = await respuesta.text();
    throw new Error(`Error de Hugging Face: ${errorTexto}`);
  }

  return await respuesta.json(); // array de vectores, uno por texto de entrada
}