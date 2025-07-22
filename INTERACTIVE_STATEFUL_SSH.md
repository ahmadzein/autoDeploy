# Interactive Stateful SSH Deployments

## Overview

The Stateful SSH Executor now supports **interactive prompts** during deployment. This means when your deployment scripts ask questions like:
- "What branch/tag do you want to deploy?"
- "Are you sure you want to continue? (y/n)"
- "Enter the database password:"

You can respond to them in real-time through the AutoDeploy GUI!

## How It Works

1. **Automatic Detection**: The system detects when a script is waiting for input
2. **GUI Prompt**: A yellow prompt appears in the deployment terminal
3. **User Input**: Type your response and press Enter or click Send
4. **Execution Continues**: Your input is sent to the script and deployment continues

## Supported Prompt Types

### Questions
- `What branch/tag do you want to deploy?`
- `Which environment would you like to use?`
- `What version should we deploy?`

### Confirmations
- `Are you sure? (y/n)`
- `Do you want to continue? (yes/no)`
- `Proceed with deployment? [Y/n]`

### Input Requests
- `Enter password:`
- `Please enter the API key:`
- `Type the branch name:`

### Generic Patterns
- Any line ending with `?`
- Any line ending with `:`
- Common patterns like "Please enter", "Choose", "Select"

## Example Deployment Flow

```yaml
Step 1: SSH to API server
Step 2: Run deployment script

Output:
[16:44:44] ssh tis-staging-api
[16:44:45] bash updateStaging.sh
[16:44:45] What branch/tag do you want to deploy?

[PROMPT] What branch/tag do you want to deploy?
> main                          # You type this

[16:44:50] Deploying branch: main
[16:44:51] Pulling latest changes...
[16:44:52] Are you sure you want to restart services? (y/n)

[PROMPT] Are you sure you want to restart services? (y/n)
> y                            # You type this

[16:44:55] Restarting services...
[16:44:56] Deployment complete!
```

## Configuration

No special configuration needed! Interactive prompts work automatically when:
1. "Use persistent SSH session" is enabled (for maintaining state)
2. Your scripts ask for input

## Best Practices

### 1. Provide Clear Prompts
Make your scripts ask clear questions:
```bash
echo "What branch/tag do you want to deploy?"
read BRANCH

echo "Deploy to production? (yes/no)"
read CONFIRM
```

### 2. Add Validation
Validate user input in your scripts:
```bash
read -p "Environment (staging/production): " ENV
if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
    echo "Invalid environment. Exiting."
    exit 1
fi
```

### 3. Timeout Handling
Consider adding timeouts to prompts:
```bash
read -t 30 -p "Branch to deploy (timeout in 30s): " BRANCH
if [ -z "$BRANCH" ]; then
    echo "No input received, using default: main"
    BRANCH="main"
fi
```

## Pre-Configured Responses

You can still pre-configure responses in your deployment steps:

```json
{
  "name": "Run deployment",
  "command": "bash deploy.sh",
  "inputs": [
    {
      "prompt": "branch",
      "value": "main"
    },
    {
      "prompt": "restart services",
      "value": "y"
    }
  ]
}
```

But with interactive prompts, you can handle dynamic questions that weren't anticipated!

## Troubleshooting

### Prompt Not Detected
- Make sure your script outputs the prompt to stdout
- Ensure the prompt ends with `?` or `:`
- Check that output buffering isn't hiding the prompt

### Input Not Working
- Verify the deployment is still running
- Check the browser console for errors
- Ensure the GUI shows the yellow prompt input field

### Script Hangs After Input
- Your script might be expecting a specific format
- Try adding explicit newlines in your script:
  ```bash
  read -r BRANCH  # Use -r for raw input
  ```

## Security Considerations

1. **Passwords**: While input is sent securely, be cautious with sensitive data
2. **Logging**: Inputs may be logged in deployment history
3. **Validation**: Always validate user input in your scripts

## Technical Details

- Uses pattern matching to detect prompts
- Maintains WebSocket-like connection for bidirectional communication
- Prompt detection happens in real-time as output streams
- Session state preserved across multiple prompts
- 60-second timeout for each command (including prompt waiting time)