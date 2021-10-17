export const path = Deno.env.get("SOCKET_PATH") ?? false;
export const host = Deno.env.get("HOST") ?? '0.0.0.0';
export const port = Deno.env.get("PORT") ?? (!path && 3000);