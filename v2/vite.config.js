import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import copy from 'rollup-plugin-copy';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    crx({
      manifest: {
        manifest_version: 3,
        name: 'Web AI Extension',
        version: '1.0.0',
        description: 'AI-powered webpage summarization and similarity search',
        permissions: [
          'activeTab',
          'storage',
          'scripting'
        ],
        host_permissions: [
          '<all_urls>'
        ],
        action: {
          default_popup: 'popup.html',
          default_title: 'Web AI Extension'
        },
        background: {
          service_worker: 'background.js'
        },
        content_scripts: [
          {
            matches: ['<all_urls>'],
            js: ['content.js']
          }
        ],
        options_page: 'options.html'
      }
    }),
    copy({
      targets: [
        { src: 'src/manifest.json', dest: 'dist' },
        { src: 'src/popup.html', dest: 'dist' },
        { src: 'src/options.html', dest: 'dist' },
        { src: 'src/background.js', dest: 'dist' },
        { src: 'src/content.js', dest: 'dist' }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.js'),
        options: resolve(__dirname, 'src/options.js'),
        content: resolve(__dirname, 'src/content.js'),
        background: resolve(__dirname, 'src/background.js')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
});
