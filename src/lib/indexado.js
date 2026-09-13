import { Index } from "@upstash/vector";
import { embeberTextos } from "@/lib/embeddings";

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
});

function construirTexto(fila) {
  return (
    `Componente: ${fila.Componente}\n` +
    `Categoría: ${fila.Categoria}\n` +
    `Cajón: ${fila.Cajon}\n` +
    `Especificaciones: ${fila.Especificaciones}\n` +
    `Aplicaciones sugeridas: ${fila.Aplicaciones}\n` +
    `Compatibilidad: ${fila.Compatibilidad}`
  );
}

// Recibe un arreglo de filas (objetos con las columnas del inventario) y
// una etiqueta de dónde vinieron (nombre de archivo, "power-automate", etc.)
// Genera embeddings y los sube a Upstash en lotes.
export async function indexarFilas(filas, fuente) {
  if (!filas || filas.length === 0) {
    throw new Error("No se recibieron filas para indexar.");
  }

  const TAMANO_LOTE = 20;
  let subidos = 0;

  for (let i = 0; i < filas.length; i += TAMANO_LOTE) {
    const lote = filas.slice(i, i + TAMANO_LOTE);
    const textosLote = lote.map(construirTexto);
    const vectoresLote = await embeberTextos(textosLote);

    const vectorsToUpsert = lote.map((fila, j) => ({
      id: String(fila.ID),
      vector: vectoresLote[j],
      metadata: {
        text: textosLote[j],
        fuente,
        componente: fila.Componente,
        cajon: String(fila.Cajon),
      },
    }));

    await index.upsert(vectorsToUpsert);
    subidos += vectorsToUpsert.length;
  }

  return subidos;
}