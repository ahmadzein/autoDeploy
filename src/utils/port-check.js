import net from 'net';

export function checkPort(port, host = 'localhost') {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(false); // Port is in use
            } else {
                resolve(false); // Other error
            }
        });
        
        server.once('listening', () => {
            server.close();
            resolve(true); // Port is available
        });
        
        server.listen(port, host);
    });
}

export async function findAvailablePort(startPort, host = 'localhost', maxAttempts = 10) {
    let port = startPort;
    
    for (let i = 0; i < maxAttempts; i++) {
        const isAvailable = await checkPort(port, host);
        if (isAvailable) {
            return port;
        }
        port++;
    }
    
    throw new Error(`No available ports found between ${startPort} and ${startPort + maxAttempts - 1}`);
}