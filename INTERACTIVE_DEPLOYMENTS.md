# Interactive Deployments Guide

AutoDeploy now supports interactive deployments that can handle prompts during execution, such as:
- SSH host key verification (`yes/no`)
- Password prompts
- Configuration questions
- Package manager confirmations
- Any command that requires user input

## How It Works

When AutoDeploy detects a command is waiting for input:

1. **Prompt Detection**: The system monitors command output for common prompt patterns
2. **GUI Notification**: A yellow prompt appears in the deployment terminal
3. **User Input**: You can type your response and press Enter or click Send
4. **Execution Continues**: Your input is sent to the command and execution continues

## Supported Prompt Types

### SSH Prompts
- `Are you sure you want to continue connecting (yes/no)?`
- `Enter passphrase for key`
- `Password:`

### Git Prompts
- `Username for 'https://github.com':`
- `Password for 'https://user@github.com':`

### Package Manager Prompts
- `Do you want to install it? (Y/n)`
- `Configuring package-name:`

### Generic Prompts
- Any line ending with `:` or `?`
- `(y/n)` confirmations
- `Enter` prompts

## Pre-Configuring Responses

You can pre-configure responses for known prompts in your deployment steps:

```json
{
  "name": "Install Dependencies",
  "command": "apt-get install nginx",
  "inputs": [
    {
      "prompt": "Do you want to continue",
      "value": "Y"
    }
  ]
}
```

## Visual Indicators

In the deployment terminal:
- **Yellow text**: Prompts waiting for input
- **Cyan text**: Your responses
- **Input field**: Appears automatically when a prompt is detected

## Best Practices

### 1. Use Non-Interactive Commands When Possible
```bash
# Instead of: apt-get install package
# Use: apt-get install -y package

# Instead of: ssh server
# Use: ssh -o StrictHostKeyChecking=no server
```

### 2. Pre-Configure Known Prompts
Add expected prompts to your step configuration to automate responses.

### 3. Test Interactively First
Run commands manually to identify what prompts might appear.

## Example Scenarios

### SSH First Connection
```
[PROMPT] The authenticity of host 'example.com' can't be established.
RSA key fingerprint is SHA256:xxxxx.
Are you sure you want to continue connecting (yes/no)?
> yes
```

### Git HTTPS Authentication
```
[PROMPT] Username for 'https://github.com':
> myusername
[PROMPT] Password for 'https://myusername@github.com':
> [password hidden]
```

### Package Installation
```
[PROMPT] After this operation, 25.6 MB of additional disk space will be used.
Do you want to continue? [Y/n]
> Y
```

## Timeout Handling

- Commands have a 60-second timeout by default
- If no input is provided, the deployment will fail with a timeout error
- You can stop the deployment at any time using the Stop button

## Security Notes

1. **Passwords**: Input is sent securely to your server, but be cautious about entering sensitive information
2. **Logs**: User inputs are logged in deployment history (passwords are not masked in logs)
3. **SSH Keys**: Prefer SSH key authentication over password prompts when possible

## Troubleshooting

### Prompt Not Detected
- Check if the command is using a PTY (some commands hide prompts without PTY)
- Enable debug mode with `AUTODEPLOY_DEBUG=true` to see raw output

### Input Not Working
- Ensure the deployment is still running
- Check for JavaScript errors in browser console
- Verify the API server is accessible

### Command Hangs After Input
- Some commands may expect specific input format
- Try adding a newline or specific terminator
- Check if the command expects additional input

## Technical Details

- Uses SSH2 library's PTY mode for proper prompt handling
- Real-time output streaming via Server-Sent Events
- Pattern matching for prompt detection
- Session-based input routing for concurrent deployments