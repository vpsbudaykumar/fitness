/** @type {import('next').NextConfig} */
const nextConfig = {
  // Capacitor needs a static export to bundle into the iOS shell.
  // Comment this out during `next dev` if you want API routes to work locally;
  // re-enable (and move AI/Supabase calls to Supabase Edge Functions or a
  // separately-hosted Vercel API) before `npm run ios:sync`.
  // output: 'export',
};
module.exports = nextConfig;
