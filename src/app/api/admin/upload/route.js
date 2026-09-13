import * as XLSX from "xlsx";
import { indexarFilas } from "@/lib/indexado";

export async function POST(request) {
  try {
    const formData = await request.formData();

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

    const buffer = Buffer.from(await archivo.arrayBuffer());
    const libro = XLSX.read(buffer, { type: "buffer" });
    const nombreHoja = libro.SheetNames.includes("Inventario")
      ? "Inventario"
      : libro.SheetNames[0];
    const hoja = libro.Sheets[nombreHoja];
    const filas = XLSX.utils.sheet_to_json(hoja);

    const subidos = await indexarFilas(filas, archivo.name);

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