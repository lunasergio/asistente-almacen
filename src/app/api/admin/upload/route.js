import { Index } from "@upstash/vector";
import * as XLSX from "xlsx";
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

export async function POST(request) {
  try {
    const formData = await request.formData();

    // Protección: solo alguien con la contraseña de administrador puede
    // actualizar el inventario, aunque el chat esté abierto para todos.
    const password = formData.get("password");
    if (password !== process.env.ADMIN_PASSWORD) {
      return Response.json(
        { error: "Contraseña de administrador incorrecta." },
        { status: 401 }
      );
    }

    const archivo = formData.get("archivo");
    if (!archivo) {
      return Response.json(
        { error: "No se recibió ningún archivo." },
        { status: 400 }
      );
    }

    // Leer el Excel directamente desde el archivo subido (sin guardarlo en disco)
    const buffer = Buffer.from(await archivo.arrayBuffer());
    const libro = XLSX.read(buffer, { type: "buffer" });
    const nombreHoja = libro.SheetNames.includes("Inventario")
      ? "Inventario"
      : libro.SheetNames[0];
    const hoja = libro.Sheets[nombreHoja];
    const filas = XLSX.utils.sheet_to_json(hoja);

    if (filas.length === 0) {
      return Response.json(
        { error: "El Excel no tiene filas de datos." },
        { status: 400 }
      );
    }

    // Generar embeddings y subir a Upstash en lotes (para no saturar a
    // Hugging Face con miles de filas en una sola petición)
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
          fuente: archivo.name,
          componente: fila.Componente,
          cajon: String(fila.Cajon),
        },
      }));

      await index.upsert(vectorsToUpsert);
      subidos += vectorsToUpsert.length;
    }

    return Response.json({
      mensaje: `Se actualizaron ${subidos} componentes correctamente.`,
    });
  } catch (error) {
    console.error("Error en /api/admin/upload:", error);
    return Response.json(
      { error: "Ocurrió un error procesando el archivo." },
      { status: 500 }
    );
  }
}