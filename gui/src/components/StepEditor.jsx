import React, { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Edit2, Save, X } from 'lucide-react';

function StepEditor({ 
  steps = [], 
  onStepsChange, 
  stepType = 'remote', 
  projectPath = '.'
}) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [newStep, setNewStep] = useState({
    name: '',
    command: '',
    workingDir: '.',
    continueOnError: false,
    interactive: false,
    inputs: []
  });
  const [newInput, setNewInput] = useState({ name: '', value: '' });

  const handleAddStep = () => {
    if (newStep.name && newStep.command) {
      onStepsChange([...steps, { ...newStep }]);
      setNewStep({
        name: '',
        command: '',
        workingDir: '.',
        continueOnError: false,
        interactive: false,
        inputs: []
      });
    }
  };

  const handleUpdateStep = (index, field, value) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    onStepsChange(updatedSteps);
  };

  const handleRemoveStep = (index) => {
    onStepsChange(steps.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleMoveStep = (index, direction) => {
    const newSteps = [...steps];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < steps.length) {
      [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
      onStepsChange(newSteps);
    }
  };

  const startEditing = (index) => {
    setEditingIndex(index);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Existing Steps */}
      {steps.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">
            {stepType === 'local' ? 'Local Steps' : 'Remote Steps'}
          </h4>
          {steps.map((step, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              {editingIndex === index ? (
                /* Edit Mode */
                <div className="space-y-3">
                  <input
                    type="text"
                    value={step.name}
                    onChange={(e) => handleUpdateStep(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Step name"
                  />
                  <input
                    type="text"
                    value={step.command}
                    onChange={(e) => handleUpdateStep(index, 'command', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                    placeholder="Command"
                  />
                  <input
                    type="text"
                    value={step.workingDir || '.'}
                    onChange={(e) => handleUpdateStep(index, 'workingDir', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Working directory"
                  />
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={step.continueOnError || false}
                        onChange={(e) => handleUpdateStep(index, 'continueOnError', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">Continue on error</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={step.interactive || false}
                        onChange={(e) => {
                          const isInteractive = e.target.checked;
                          handleUpdateStep(index, 'interactive', isInteractive);
                          if (!isInteractive) {
                            handleUpdateStep(index, 'inputs', []);
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">Interactive (has prompts)</span>
                    </label>
                  </div>
                  
                  {/* Prefilled inputs management in edit mode */}
                  {step.interactive && (
                    <div className="p-3 bg-gray-100 rounded-md">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Prefilled Inputs</h5>
                      
                      {/* Existing inputs */}
                      {step.inputs && step.inputs.length > 0 && (
                        <div className="space-y-2 mb-2">
                          {step.inputs.map((input, inputIdx) => (
                            <div key={inputIdx} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={input.name}
                                onChange={(e) => {
                                  const updatedInputs = [...(step.inputs || [])];
                                  updatedInputs[inputIdx].name = e.target.value;
                                  handleUpdateStep(index, 'inputs', updatedInputs);
                                }}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="Input name"
                              />
                              <input
                                type="text"
                                value={input.value}
                                onChange={(e) => {
                                  const updatedInputs = [...(step.inputs || [])];
                                  updatedInputs[inputIdx].value = e.target.value;
                                  handleUpdateStep(index, 'inputs', updatedInputs);
                                }}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="Value (empty for 'press enter')"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedInputs = step.inputs.filter((_, i) => i !== inputIdx);
                                  handleUpdateStep(index, 'inputs', updatedInputs);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Add new input */}
                      <button
                        type="button"
                        onClick={() => {
                          const currentInputs = step.inputs || [];
                          handleUpdateStep(index, 'inputs', [...currentInputs, { name: '', value: '' }]);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        + Add Input
                      </button>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingIndex(null)}
                      className="px-3 py-1 text-sm text-green-600 hover:text-green-700"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{step.name}</h5>
                      <p className="text-sm text-gray-700 font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                        {step.command}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                        <span>Working dir: {step.workingDir || '.'}</span>
                        {step.continueOnError && <span className="text-orange-600">• Continues on error</span>}
                        {step.interactive && <span className="text-blue-600">• Interactive</span>}
                        {step.inputs && step.inputs.length > 0 && (
                          <span className="text-green-600">• {step.inputs.length} prefilled inputs</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        type="button"
                        onClick={() => handleMoveStep(index, -1)}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        title="Move up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStep(index, 1)}
                        disabled={index === steps.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        title="Move down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditing(index)}
                        className="text-blue-600 hover:text-blue-700"
                        title="Edit step"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(index)}
                        className="text-red-600 hover:text-red-700"
                        title="Remove step"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add New Step */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Add New {stepType === 'local' ? 'Local' : 'Remote'} Step
        </h4>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              name="name"
              value={newStep.name}
              onChange={(e) => setNewStep({ ...newStep, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Step name"
            />
            <input
              type="text"
              name="workingDir"
              value={newStep.workingDir}
              onChange={(e) => setNewStep({ ...newStep, workingDir: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Working directory (relative to ${stepType === 'local' ? 'local' : 'remote'} path)`}
            />
          </div>
          <input
            type="text"
            name="command"
            value={newStep.command}
            onChange={(e) => setNewStep({ ...newStep, command: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono"
            placeholder={`Command to run ${stepType === 'local' ? 'locally' : 'on server'}`}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="continueOnError"
                  checked={newStep.continueOnError}
                  onChange={(e) => setNewStep({ ...newStep, continueOnError: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Continue on error</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="interactive"
                  checked={newStep.interactive}
                  onChange={(e) => {
                    const isInteractive = e.target.checked;
                    setNewStep({ 
                      ...newStep, 
                      interactive: isInteractive,
                      inputs: isInteractive ? (newStep.inputs || []) : []
                    });
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Interactive (has prompts)</span>
              </label>
            </div>
            <button
              type="button"
              onClick={handleAddStep}
              disabled={!newStep.name || !newStep.command}
              className="inline-flex items-center px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add {stepType === 'local' ? 'Local' : 'Remote'} Step
            </button>
          </div>
          
          {/* Prefilled inputs for new interactive step */}
          {newStep.interactive && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Prefilled Inputs (Optional)</h5>
              <p className="text-xs text-gray-600 mb-3">
                Configure automatic responses for prompts. Leave value empty for "Press enter" prompts.
              </p>
              
              {/* Existing inputs for new step */}
              {newStep.inputs && newStep.inputs.length > 0 && (
                <div className="space-y-2 mb-3">
                  {newStep.inputs.map((input, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-white p-2 rounded border border-gray-200">
                      <input
                        type="text"
                        value={input.name}
                        onChange={(e) => {
                          const updatedInputs = [...newStep.inputs];
                          updatedInputs[idx].name = e.target.value;
                          setNewStep({ ...newStep, inputs: updatedInputs });
                        }}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="Input name"
                      />
                      <input
                        type="text"
                        value={input.value}
                        onChange={(e) => {
                          const updatedInputs = [...newStep.inputs];
                          updatedInputs[idx].value = e.target.value;
                          setNewStep({ ...newStep, inputs: updatedInputs });
                        }}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="Value (empty for 'press enter')"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updatedInputs = newStep.inputs.filter((_, i) => i !== idx);
                          setNewStep({ ...newStep, inputs: updatedInputs });
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add new input */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newInput.name}
                  onChange={(e) => setNewInput({ ...newInput, name: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newInput.name) {
                      e.preventDefault();
                      const currentInputs = newStep.inputs || [];
                      setNewStep({ ...newStep, inputs: [...currentInputs, { ...newInput }] });
                      setNewInput({ name: '', value: '' });
                    }
                  }}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  placeholder="Input name (e.g., branch)"
                />
                <input
                  type="text"
                  value={newInput.value}
                  onChange={(e) => setNewInput({ ...newInput, value: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newInput.name) {
                      e.preventDefault();
                      const currentInputs = newStep.inputs || [];
                      setNewStep({ ...newStep, inputs: [...currentInputs, { ...newInput }] });
                      setNewInput({ name: '', value: '' });
                    }
                  }}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  placeholder="Value (leave empty for 'press enter')"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newInput.name) {
                      const currentInputs = newStep.inputs || [];
                      setNewStep({ ...newStep, inputs: [...currentInputs, { ...newInput }] });
                      setNewInput({ name: '', value: '' });
                    }
                  }}
                  disabled={!newInput.name}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StepEditor;