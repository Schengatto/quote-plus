/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        appVersion: process.env.NEXT_PUBLIC_APP_VERSION
    }
};

module.exports = nextConfig;
