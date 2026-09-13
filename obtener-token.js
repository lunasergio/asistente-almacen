// Este script se corre UNA SOLA VEZ desde tu compu, para autorizar la app
// con tu cuenta de Microsoft 365. Genera un "cache" que la web usará
// automáticamente después para renovar el acceso sin que tengas que
// volver a iniciar sesión.
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const { PublicClientApplication } = require("@azure/msal-node");

async function main() {
  const pca = new PublicClientApplication({
    auth: {
      clientId: process.env.MS_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}`,
    },
  });

  const deviceCodeRequest = {
    scopes: ["Files.Read", "offline_access"],
    deviceCodeCallback: (response) => {
      console.log("\n=== SIGUE ESTOS PASOS ===");
      console.log(response.message);
      console.log("==========================\n");
    },
  };

  const respuesta = await pca.acquireTokenByDeviceCode(deviceCodeRequest);
  console.log("✅ Autenticación exitosa para:", respuesta.account.username);

  const cacheSerializado = pca.getTokenCache().serialize();
  const base64 = Buffer.from(cacheSerializado).toString("base64");

  fs.writeFileSync("cache-temporal.txt", base64);
  console.log("\nEl valor para tu variable MS_TOKEN_CACHE se guardó en 'cache-temporal.txt'.");
  console.log("Cópialo a tu .env.local y a Vercel, y luego BORRA ese archivo (contiene credenciales).");
}

main().catch((err) => console.error("Error:", err));