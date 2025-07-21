# Solution for Nested SSH Deployments

## The Problem

Your deployment has these steps:
1. SSH to jump server (EC2 instance)
2. From there, SSH to `tis-staging-api` 
3. Run `bash updateStaging.sh` on `tis-staging-api`

The system is trying to run commands on the wrong server.

## Quick Solution

Instead of having two separate steps:
```
Step 1: ssh tis-staging-api
Step 2: bash updateStaging.sh
```

**Combine them into one step:**
```
Step 1: ssh tis-staging-api 'bash updateStaging.sh'
```

This tells the system to:
1. SSH to tis-staging-api
2. Run the command there
3. Exit

## Alternative Solutions

### Option 1: Use Full Path
If `updateStaging.sh` is in a specific directory on `tis-staging-api`:
```
ssh tis-staging-api 'cd /path/to/scripts && bash updateStaging.sh'
```

### Option 2: Create a Jump Script
On your EC2 instance, create `deploy-api.sh`:
```bash
#!/bin/bash
ssh tis-staging-api << 'EOF'
cd /path/to/api
bash updateStaging.sh
EOF
```

Then in AutoDeploy, just have one step:
```
bash deploy-api.sh
```

### Option 3: Use SSH ProxyJump
If you always need to go through the EC2 instance to reach tis-staging-api, configure SSH properly:

1. In your `~/.ssh/config`:
```
Host tis-staging-api-direct
    HostName tis-staging-api
    User ec2-user
    ProxyJump ec2-instance
```

2. Then configure AutoDeploy to deploy directly to `tis-staging-api-direct`

## Recommended Configuration

For your sub-deployment:
- **Remote Path**: Leave as `.` (since you're not using it)
- **Deployment Steps**:
  1. Name: "Deploy API"
     Command: `ssh tis-staging-api 'cd /path/to/api && bash updateStaging.sh'`
     Working Dir: `.`

This way everything runs in a single SSH command and completes properly.