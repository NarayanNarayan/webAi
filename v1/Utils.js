// Utility function to replace key-value pairs in dst with those from src for matching keys
function replaceJsonValues(src, dst) {
    for (const key in src) {
        if (dst.hasOwnProperty(key)) {
            dst[key] = src[key];
        }
    }
    return dst;
}
function overrideJsonValues(src, dst) {
    for (const key in src) {
        dst[key] = src[key];
    }
    return dst;
}

// Export if needed (for Node.js or module usage)
// module.exports = { replaceJsonValues }; 