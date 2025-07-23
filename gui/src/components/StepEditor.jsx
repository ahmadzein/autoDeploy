import React, { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Edit2, Save, X, Settings } from 'lucide-react';

function StepEditor({ 
  steps = [], 
  onStepsChange, 
  stepType = 'remote', 
  projectPath = '.'
}) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingInputs, setEditingInputs] = useState(false);
  const [editingInputsIndex, setEditingInputsIndex] = useState(null);
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
    if (editingInputsIndex === index) {
      setEditingInputsIndex(null);
      setEditingInputs(false);
    }
  };

  const handleMoveStep = (index, direction) => {
    const newSteps = [...steps];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < steps.length) {
      [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
      onStepsChange(newSteps);
    }
  };

  const handleAddInput = (stepIndex) => {
    if (newInput.name) {
      const updatedSteps = [...steps];
      if (!updatedSteps[stepIndex].inputs) {
        updatedSteps[stepIndex].inputs = [];
      }
      updatedSteps[stepIndex].inputs.push({ ...newInput });
      onStepsChange(updatedSteps);
      setNewInput({ name: '', value: '' });
    }
  };

  const handleRemoveInput = (stepIndex, inputIndex) => {
    const updatedSteps = [...steps];
    updatedSteps[stepIndex].inputs = updatedSteps[stepIndex].inputs.filter((_, i) => i !== inputIndex);
    onStepsChange(updatedSteps);
  };

  const handleUpdateInput = (stepIndex, inputIndex, field, value) => {
    const updatedSteps = [...steps];
    updatedSteps[stepIndex].inputs[inputIndex][field] = value;
    onStepsChange(updatedSteps);
  };

  const startEditing = (index) => {
    setEditingIndex(index);
    setEditingInputs(false);
    setEditingInputsIndex(null);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
  };

  const startEditingInputs = (index) => {
    setEditingInputsIndex(index);
    setEditingInputs(true);
    setEditingIndex(null);
    setNewInput({ name: '', value: '' });
  };

  const cancelEditingInputs = () => {
    setEditingInputsIndex(null);
    setEditingInputs(false);
    setNewInput({ name: '', value: '' });
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
                        onChange={(e) => handleUpdateStep(index, 'interactive', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">Interactive (has prompts)</span>
                    </label>
                  </div>
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
              ) : editingInputs && editingInputsIndex === index ? (
                /* Edit Inputs Mode */
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-gray-700">
                      Prefilled Inputs for: {step.name}
                    </h5>
                    <button
                      type="button"
                      onClick={cancelEditingInputs}
                      className="text-gray-600 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Existing Inputs */}
                  {step.inputs && step.inputs.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {step.inputs.map((input, inputIndex) => (
                        <div key={inputIndex} className="flex items-center space-x-2 bg-white p-2 rounded border border-gray-200">
                          <input
                            type="text"
                            value={input.name}
                            onChange={(e) => handleUpdateInput(index, inputIndex, 'name', e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                            placeholder="Input name"
                          />
                          <input
                            type="text"
                            value={input.value}
                            onChange={(e) => handleUpdateInput(index, inputIndex, 'value', e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                            placeholder="Value (empty for 'press enter')"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveInput(index, inputIndex)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add New Input */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newInput.name}
                      onChange={(e) => setNewInput({ ...newInput, name: e.target.value })}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="Input name (e.g., branch)"
                    />
                    <input
                      type="text"
                      value={newInput.value}
                      onChange={(e) => setNewInput({ ...newInput, value: e.target.value })}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="Value (leave empty for 'press enter')"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddInput(index)}
                      disabled={!newInput.name}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-600 mt-2">
                    Inputs will be used in order when prompts are detected. Leave value empty for "Press enter" prompts.
                  </p>
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
                      {step.interactive && (
                        <button
                          type="button"
                          onClick={() => startEditingInputs(index)}
                          className="text-green-600 hover:text-green-700"
                          title="Manage inputs"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                      )}
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
                  onChange={(e) => setNewStep({ ...newStep, interactive: e.target.checked })}
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
        </div>
      </div>
    </div>
  );
}

export default StepEditor;