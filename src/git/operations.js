import simpleGit from 'simple-git';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { resolve } from 'path';

export class GitOperations {
    constructor(repoPath) {
        // Expand ~ to home directory
        if (repoPath.startsWith('~')) {
            repoPath = repoPath.replace('~', homedir());
        }
        this.repoPath = resolve(repoPath);
        
        // Check if directory exists
        if (!existsSync(this.repoPath)) {
            console.error(`Directory does not exist: ${this.repoPath}`);
            this.git = null;
            return;
        }
        
        this.git = simpleGit(this.repoPath);
    }

    async isGitRepo() {
        if (!this.git) return false;
        try {
            await this.git.status();
            return true;
        } catch (error) {
            return false;
        }
    }

    async hasChanges() {
        if (!this.git) return false;
        const status = await this.git.status();
        return !status.isClean();
    }

    async getStatus() {
        if (!this.git) return null;
        return await this.git.status();
    }

    async addAll() {
        if (!this.git) return null;
        return await this.git.add('.');
    }

    async commit(message) {
        if (!this.git) return null;
        return await this.git.commit(message);
    }

    async getCurrentBranch() {
        if (!this.git) return null;
        const status = await this.git.status();
        return status.current;
    }

    async hasRemote() {
        if (!this.git) return false;
        const remotes = await this.git.getRemotes();
        return remotes.length > 0;
    }

    async push(remote = 'origin', branch = null) {
        if (!this.git) return null;
        if (!branch) {
            branch = await this.getCurrentBranch();
        }
        return await this.git.push(remote, branch);
    }

    async pull(remote = 'origin', branch = null) {
        if (!this.git) return null;
        if (!branch) {
            branch = await this.getCurrentBranch();
        }
        return await this.git.pull(remote, branch);
    }

    async commitAndPush(message, remote = 'origin', branch = null) {
        try {
            const hasChanges = await this.hasChanges();
            if (!hasChanges) {
                return { success: true, message: 'No changes to commit' };
            }

            await this.addAll();
            await this.commit(message);
            
            if (await this.hasRemote()) {
                await this.push(remote, branch);
                return { success: true, message: 'Changes committed and pushed successfully' };
            } else {
                return { success: true, message: 'Changes committed locally (no remote configured)' };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async getLastCommit() {
        if (!this.git) return null;
        const log = await this.git.log(['-1']);
        return log.latest;
    }
}