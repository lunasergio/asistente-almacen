"use client";

import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [mensajes, setMensajes] = useState([
    {
      rol: "asistente",
      texto: "Hola, soy tu asistente de almacén. Pregúntame sobre capacitores, resistencias, rodamientos, sensores o tornillería.",
    },
  ]);
  const [pregunta, setPregunta] = useState("");
  const [cargando, setCargando] = useState(false);
  const finRef = useRef(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  async function enviarPregunta(e) {
    e.preventDefault();
    const preguntaActual = pregunta.trim();
    if (!preguntaActual || cargando) return;

    setMensajes((prev) => [...prev, { rol: "usuario", texto: preguntaActual }]);
    setPregunta("");
    setCargando(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta: preguntaActual }),
      });

      const datos = await res.json();

      if (!res.ok) {
        throw new Error(datos.error || "Error desconocido");
      }

      setMensajes((prev) => [
        ...prev,
        { rol: "asistente", texto: datos.respuesta },
      ]);
    } catch (error) {
      setMensajes((prev) => [
        ...prev,
        {
          rol: "asistente",
          texto: "Hubo un error al procesar tu pregunta. Intenta de nuevo.",
        },
      ]);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={estilos.contenedor}>
      <header style={estilos.header}>
        <h1 style={estilos.titulo}>Asistente de Almacén</h1>
      </header>

      <div style={estilos.chat}>
        {mensajes.map((m, i) => (
          <div
            key={i}
            style={{
              ...estilos.burbuja,
              ...(m.rol === "usuario" ? estilos.burbujaUsuario : estilos.burbujaAsistente),
            }}
          >
            {m.texto}
          </div>
        ))}
        {cargando && (
          <div style={{ ...estilos.burbuja, ...estilos.burbujaAsistente }}>
            Pensando...
          </div>
        )}
        <div ref={finRef} />
      </div>

      <form onSubmit={enviarPregunta} style={estilos.formulario}>
        <input
          type="text"
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
          placeholder="Escribe tu pregunta..."
          style={estilos.input}
          disabled={cargando}
        />
        <button type="submit" style={estilos.boton} disabled={cargando}>
          Enviar
        </button>
      </form>
    </div>
  );
}

const estilos = {
  contenedor: {
    display: "flex",
    flexDirection: "column",
    height: "100dvh",
    maxWidth: "600px",
    margin: "0 auto",
    fontFamily: "system-ui, sans-serif",
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: "16px",
    backgroundColor: "#1a1a2e",
    color: "white",
  },
  titulo: {
    margin: 0,
    fontSize: "1.2rem",
  },
  chat: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  burbuja: {
    padding: "10px 14px",
    borderRadius: "14px",
    maxWidth: "80%",
    lineHeight: 1.4,
    whiteSpace: "pre-wrap",
  },
  burbujaUsuario: {
    backgroundColor: "#1a1a2e",
    color: "white",
    alignSelf: "flex-end",
  },
  burbujaAsistente: {
    backgroundColor: "white",
    color: "#1a1a2e",
    alignSelf: "flex-start",
    border: "1px solid #ddd",
  },
  formulario: {
    display: "flex",
    padding: "12px",
    gap: "8px",
    borderTop: "1px solid #ddd",
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    padding: "12px",
    borderRadius: "10px",
    border: "2px solid #1a1a2e",
    fontSize: "1rem",
    backgroundColor: "#ffffff",
    color: "#1a1a2e",
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
};