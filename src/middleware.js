import { NextResponse } from "next/server";

export function middleware(request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader) {
    const authValue = authHeader.split(" ")[1];
    const [user, password] = atob(authValue).split(":");

    if (password === process.env.APP_PASSWORD) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Autenticación requerida.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Asistente de Almacén"',
    },
  });
}

// Aplica el middleware a todas las rutas
export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
