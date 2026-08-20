/// <reference types="astro/client" />

type CloudflareEnv = {
  DB: import('@cloudflare/workers-types').D1Database;
  JWT_SECRET: string;
};

declare namespace App {
  interface Locals {
    runtime: { env: CloudflareEnv };
  }
}
