export function validateProjectConfig(config) {
  const errors = [];
  
  if (!config.name || typeof config.name !== 'string') {
    errors.push('Project name is required and must be a string');
  }
  
  if (!config.localPath || typeof config.localPath !== 'string') {
    errors.push('Local path is required and must be a string');
  }
  
  if (!config.remotePath || typeof config.remotePath !== 'string') {
    errors.push('Remote path is required and must be a string');
  }
  
  if (!config.ssh || typeof config.ssh !== 'object') {
    errors.push('SSH configuration is required');
  } else {
    if (!config.ssh.host) errors.push('SSH host is required');
    if (!config.ssh.username) errors.push('SSH username is required');
    if (!config.ssh.password) errors.push('SSH password is required');
    if (config.ssh.port && typeof config.ssh.port !== 'number') {
      errors.push('SSH port must be a number');
    }
  }
  
  return errors;
}

export function validateSteps(steps) {
  const errors = [];
  
  if (!Array.isArray(steps)) {
    errors.push('Steps must be an array');
    return errors;
  }
  
  steps.forEach((step, index) => {
    if (!step.name || typeof step.name !== 'string') {
      errors.push(`Step ${index + 1}: name is required`);
    }
    if (!step.command || typeof step.command !== 'string') {
      errors.push(`Step ${index + 1}: command is required`);
    }
    if (step.workingDir && typeof step.workingDir !== 'string') {
      errors.push(`Step ${index + 1}: workingDir must be a string`);
    }
    if (step.continueOnError !== undefined && typeof step.continueOnError !== 'boolean') {
      errors.push(`Step ${index + 1}: continueOnError must be a boolean`);
    }
  });
  
  return errors;
}

export function getJSONValidationErrors(content, mode) {
  try {
    const parsed = JSON.parse(content);
    
    switch (mode) {
      case 'config':
        return validateProjectConfig(parsed);
      case 'local-steps':
      case 'remote-steps':
        return validateSteps(parsed);
      case 'full':
        const configErrors = validateProjectConfig(parsed);
        const localStepErrors = parsed.localSteps ? validateSteps(parsed.localSteps).map(e => `Local Steps: ${e}`) : [];
        const remoteStepErrors = parsed.deploymentSteps ? validateSteps(parsed.deploymentSteps).map(e => `Remote Steps: ${e}`) : [];
        return [...configErrors, ...localStepErrors, ...remoteStepErrors];
      default:
        return [];
    }
  } catch (error) {
    return [`JSON Parse Error: ${error.message}`];
  }
}