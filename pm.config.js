module.exports = {
    apps: [
        {
            "script": "index.js",
            "watch": false,
            "max_memory_restart": "1000M",
            "exec_mode" : "cluster",
            "output": "/dev/null",
            "error": "/dev/null"
        }
    ]
}