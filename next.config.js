/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        tinymceApiKey: process.env.NEXT_PUBLIC_TINYMCE_API_KEY,
        appVersion: process.env.NEXT_PUBLIC_APP_VERSION
    }
}

module.exports = nextConfig
