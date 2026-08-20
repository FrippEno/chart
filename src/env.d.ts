/// <reference types="astro/client" />

type CloudflareEnv = {
  DB: import('@cloudflare/workers-types').D1Database;
};

declare namespace App {
  interface Locals {
    runtime: { env: CloudflareEnv };
  }
}
