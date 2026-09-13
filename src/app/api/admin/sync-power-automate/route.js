import { indexarFilas } from "@/lib/indexado";

export async function POST(request) {
  try {
    // Protección: Power Automate debe mandar esta clave en el header
    // "x-sync-secret", en vez de una contraseña en un formulario.
    const claveRecibida = request.headers.get("x-sync-secret");
    if (claveRecibida !== process.env.SYNC_SECRET) {
      return Response.json({ error: "No autorizado." }, { status: 401 });
    }

    const { filas } = await request.json();

    if (!filas || !Array.isArray(filas)) {
      return Response.json(
        { error: "El cuerpo debe incluir un arreglo 'filas'." },
        { status: 400 }
      );
    }

    const subidos = await indexarFilas(filas, "power-automate-onedrive");

    return Response.json({
      mensaje: `Se actualizaron ${subidos} componentes correctamente.`,
    });
  } catch (error) {
    console.error("Error en /api/admin/sync-power-automate:", error);
    return Response.json(
      { error: "Ocurrió un error procesando la sincronización." },
      { status: 500 }
    );
  }
}