import React, { useState } from 'react'
import { X, User, Database, Save, Eye, EyeOff } from 'lucide-react'
import { useApi } from '../contexts/ApiContext'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { config, setConfig, devices, deviceMetadata, selectedDevices, setSelectedDevices, clearStoredData } = useApi()
  const [activeTab, setActiveTab] = useState<'config' | 'devices'>('config')
  const [showPassword, setShowPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    userId: config?.userId || '6582ae855711ae5df30ee386',
    dataUrl: config?.dataUrl || 'datads.iosense.io',
    dsUrl: config?.dsUrl || 'ds-server.iosense.io',
    onPrem: config?.onPrem || false,
    tz: config?.tz || 'UTC'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setConfig(formData)
    onClose()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleDeviceSelection = (deviceId: string, checked: boolean) => {
    const newSelectedDevices = new Set(selectedDevices)
    if (checked) {
      newSelectedDevices.add(deviceId)
    } else {
      newSelectedDevices.delete(deviceId)
    }
    setSelectedDevices(newSelectedDevices)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDevices(new Set(devices.map(d => d.devID)))
    } else {
      setSelectedDevices(new Set())
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('config')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'config'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              User Configuration
            </button>
            <button
              onClick={() => setActiveTab('devices')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'devices'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Database className="w-4 h-4 inline mr-2" />
              Device Information
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'config' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                  User ID *
                </label>
                <input
                  type="text"
                  id="userId"
                  name="userId"
                  value={formData.userId}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="Enter your user ID"
                  required
                />
              </div>

              <div>
                <label htmlFor="dataUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Data URL *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="dataUrl"
                    name="dataUrl"
                    value={formData.dataUrl}
                    onChange={handleInputChange}
                    className="input w-full pr-10"
                    placeholder="Enter data URL"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="dsUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  DS URL *
                </label>
                <input
                  type="text"
                  id="dsUrl"
                  name="dsUrl"
                  value={formData.dsUrl}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="Enter DS URL"
                  required
                />
              </div>

              <div>
                <label htmlFor="tz" className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  id="tz"
                  name="tz"
                  value={formData.tz}
                  onChange={handleInputChange}
                  className="input w-full"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Asia/Shanghai">Shanghai</option>
                  <option value="Asia/Kolkata">India</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="onPrem"
                  name="onPrem"
                  checked={formData.onPrem}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="onPrem" className="ml-2 block text-sm text-gray-900">
                  On-Premise Installation
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-blue-800">
                  💾 Your settings are automatically saved locally and will be remembered next time you open the app.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-900 mb-2">Device Overview</h3>
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span className="font-medium text-blue-700">Total Devices:</span>
                    <span className="ml-2 text-blue-900">{devices.length}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Device Types:</span>
                    <span className="ml-2 text-blue-900">
                      {new Set(devices.map(d => deviceMetadata[d.devID]?.devTypeName || d.devTypeID || 'Unknown')).size}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-blue-800">
                  💾 Your device selections are automatically saved and will be restored when you restart the app.
                </p>
              </div>

              {devices.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Steam Trap Devices</h3>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="selectAll"
                        checked={selectedDevices.size === devices.length && devices.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="selectAll" className="text-sm text-gray-700">
                        Select All ({selectedDevices.size}/{devices.length})
                      </label>
                    </div>
                  </div>
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Select
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Device ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Device Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sensors
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {devices.map((device) => {
                            const metadata = deviceMetadata[device.devID]
                            const isSelected = selectedDevices.has(device.devID)
                            return (
                              <tr key={device.devID} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => handleDeviceSelection(device.devID, e.target.checked)}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {device.devID}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {metadata?.devName || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {metadata?.devTypeName || device.devTypeID || 'Unknown'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {metadata?.sensors?.length || 0}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No devices available. Please configure your API settings first.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsModal 