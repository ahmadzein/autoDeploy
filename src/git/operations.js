import simpleGit from 'simple-git';
import { existsSync } from 'fs';

export class GitOperations {
    constructor(repoPath) {
        this.repoPath = repoPath;
        this.git = simpleGit(repoPath);
    }

    async isGitRepo() {
        try {
            await this.git.status();
            return true;
        } catch (error) {
            return false;
        }
    }

    async hasChanges() {
        const status = await this.git.status();
        return !status.isClean();
    }

    async getStatus() {
        return await this.git.status();
    }

    async addAll() {
        return await this.git.add('.');
    }

    async commit(message) {
        return await this.git.commit(message);
    }

    async getCurrentBranch() {
        const status = await this.git.status();
        return status.current;
    }

    async hasRemote() {
        const remotes = await this.git.getRemotes();
        return remotes.length > 0;
    }

    async push(remote = 'origin', branch = null) {
        if (!branch) {
            branch = await this.getCurrentBranch();
        }
        return await this.git.push(remote, branch);
    }

    async pull(remote = 'origin', branch = null) {
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
        const log = await this.git.log(['-1']);
        return log.latest;
    }
}