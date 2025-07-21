import { Client } from 'ssh2';
import { promisify } from 'util';
import { readFileSync } from 'fs';

export class SSHConnection {
    constructor(config) {
        this.config = config;
        this.conn = new Client();
    }

    connect() {
        return new Promise((resolve, reject) => {
            const connectionConfig = {
                host: this.config.host,
                username: this.config.username,
                port: this.config.port || 22
            };

            // Add authentication method
            if (this.config.privateKeyPath) {
                // Use key-based authentication
                try {
                    connectionConfig.privateKey = readFileSync(this.config.privateKeyPath);
                    if (this.config.passphrase) {
                        connectionConfig.passphrase = this.config.passphrase;
                    }
                } catch (error) {
                    reject(new Error(`Failed to read private key: ${error.message}`));
                    return;
                }
            } else if (this.config.password) {
                // Use password authentication
                connectionConfig.password = this.config.password;
            } else {
                reject(new Error('No authentication method provided (password or private key)'));
                return;
            }

            // Add additional SSH options if provided
            if (this.config.sshOptions) {
                Object.assign(connectionConfig, this.config.sshOptions);
            }

            this.conn.on('ready', () => {
                resolve();
            }).on('error', (err) => {
                reject(err);
            }).connect(connectionConfig);
        });
    }

    exec(command) {
        return new Promise((resolve, reject) => {
            this.conn.exec(command, (err, stream) => {
                if (err) return reject(err);
                
                let stdout = '';
                let stderr = '';
                
                stream.on('close', (code, signal) => {
                    resolve({
                        code,
                        stdout,
                        stderr,
                        signal
                    });
                }).on('data', (data) => {
                    stdout += data.toString();
                }).stderr.on('data', (data) => {
                    stderr += data.toString();
                });
            });
        });
    }

    async execMultiple(commands) {
        const results = [];
        for (const command of commands) {
            const result = await this.exec(command);
            results.push({
                command,
                ...result
            });
            if (result.code !== 0 && !command.ignoreError) {
                break;
            }
        }
        return results;
    }

    disconnect() {
        this.conn.end();
    }

    async testConnection() {
        try {
            await this.connect();
            const result = await this.exec('echo "Connection successful"');
            this.disconnect();
            return { success: true, message: result.stdout.trim() };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}