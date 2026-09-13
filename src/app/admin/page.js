"use client";

import { useState } from "react";

export default function Admin() {
  const [password, setPassword] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);

  async function subirArchivo(e) {
    e.preventDefault();
    if (!archivo) {
      setMensaje("Selecciona un archivo Excel primero.");
      setEsError(true);
      return;
    }

    setCargando(true);
    setMensaje("");

    const formData = new FormData();
    formData.append("password", password);
    formData.append("archivo", archivo);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const datos = await res.json();

      if (!res.ok) {
        throw new Error(datos.error || "Error desconocido");
      }

      setMensaje(datos.mensaje);
      setEsError(false);
    } catch (error) {
      setMensaje(error.message);
      setEsError(true);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={estilos.contenedor}>
      <h1 style={estilos.titulo}>Administración del inventario</h1>
      <p style={estilos.descripcion}>
        Sube el archivo Excel actualizado para reindexar la base de datos del asistente.
      </p>

      <form onSubmit={subirArchivo} style={estilos.formulario}>
        <label style={estilos.label}>
          Contraseña de administrador
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={estilos.input}
            disabled={cargando}
          />
        </label>

        <label style={estilos.label}>
          Archivo Excel (.xlsx)
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setArchivo(e.target.files[0])}
            style={estilos.inputFile}
            disabled={cargando}
          />
        </label>

        <button type="submit" style={estilos.boton} disabled={cargando}>
          {cargando ? "Subiendo y generando embeddings..." : "Actualizar inventario"}
        </button>
      </form>

      {mensaje && (
        <p style={{ ...estilos.mensaje, color: esError ? "#c0392b" : "#27ae60" }}>
          {mensaje}
        </p>
      )}
    </div>
  );
}

const estilos = {
  contenedor: {
    maxWidth: "500px",
    margin: "40px auto",
    padding: "24px",
    fontFamily: "system-ui, sans-serif",
  },
  titulo: {
    fontSize: "1.4rem",
    marginBottom: "8px",
  },
  descripcion: {
    color: "#555",
    marginBottom: "24px",
  },
  formulario: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontWeight: "bold",
    fontSize: "0.9rem",
  },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "2px solid #1a1a2e",
    fontSize: "1rem",
    backgroundColor: "#ffffff",
    color: "#1a1a2e",
  },
  inputFile: {
    padding: "8px 0",
  },
  boton: {
    padding: "12px 20px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#1a1a2e",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  mensaje: {
    marginTop: "16px",
    fontWeight: "bold",
  },
};