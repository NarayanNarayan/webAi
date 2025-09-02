#!/usr/bin/env node

/**
 * Build script for Web AI Extension
 * Prepares the extension for loading into Chrome
 */

import { execSync } from 'child_process';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🚀 Building Web AI Extension...');

try {
    // Create dist directory if it doesn't exist
    const distDir = join(process.cwd(), 'dist');
    if (!existsSync(distDir)) {
        mkdirSync(distDir, { recursive: true });
    }

    // Copy static files
    const staticFiles = [
        'src/popup.html',
        'src/options.html',
        'src/background.js',
        'src/content.js'
    ];

    console.log('📁 Copying static files...');
    staticFiles.forEach(file => {
        const source = join(process.cwd(), file);
        const dest = join(distDir, file.replace('src/', ''));
        
        if (existsSync(source)) {
            copyFileSync(source, dest);
            console.log(`  ✓ Copied ${file}`);
        } else {
            console.warn(`  ⚠️  File not found: ${file}`);
        }
    });

    // Copy CSS files
    const cssFiles = [
        'src/popup.css',
        'src/options.css'
    ];

    console.log('🎨 Copying CSS files...');
    cssFiles.forEach(file => {
        const source = join(process.cwd(), file);
        const dest = join(distDir, file.replace('src/', ''));
        
        if (existsSync(source)) {
            copyFileSync(source, dest);
            console.log(`  ✓ Copied ${file}`);
        } else {
            console.warn(`  ⚠️  File not found: ${file}`);
        }
    });

    // Create manifest.json
    const manifest = {
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
    };

    const manifestPath = join(distDir, 'manifest.json');
    const fs = await import('fs');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('  ✓ Created manifest.json');

    console.log('\n✅ Extension built successfully!');
    console.log('📁 Extension files are in the dist/ folder');
    console.log('🔧 Load the extension in Chrome:');
    console.log('   1. Go to chrome://extensions/');
    console.log('   2. Enable Developer mode');
    console.log('   3. Click "Load unpacked"');
    console.log('   4. Select the dist/ folder');
    console.log('\n🚀 Happy browsing with AI!');

} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}
