import { Client } from 'ssh2';
import { promisify } from 'util';

export class SSHConnection {
    constructor(config) {
        this.config = config;
        this.conn = new Client();
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.conn.on('ready', () => {
                resolve();
            }).on('error', (err) => {
                reject(err);
            }).connect({
                host: this.config.host,
                username: this.config.username,
                password: this.config.password,
                port: this.config.port || 22
            });
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