import React, { useState, useEffect } from 'react'
import { Settings, Activity, Database, Thermometer, Gauge, RefreshCw } from 'lucide-react'
import { useApi } from '../contexts/ApiContext'
import { DeviceDetail, DeviceMetadata } from 'connector-userid-ts'
import SettingsModal from './SettingsModal'
import DeviceDataTable from './DeviceDataTable'
import LoadingSpinner from './LoadingSpinner'
import ErrorAlert from './ErrorAlert'

const Dashboard: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { 
    config, 
    dataAccess, 
    devices, 
    setDevices, 
    deviceMetadata, 
    setDeviceMetadata,
    selectedDevices,
    setSelectedDevices,
    isLoading, 
    setIsLoading, 
    error, 
    setError 
  } = useApi()

  // Load devices when dataAccess is available
  useEffect(() => {
    const loadDevices = async () => {
      if (!dataAccess) return

      setIsLoading(true)
      setError(null)
      
      try {
        const deviceDetails = await dataAccess.getDeviceDetails()
        if (Array.isArray(deviceDetails)) {
          // Filter only Steam Trap devices
          const steamTrapDevices = deviceDetails.filter(device => 
            device.devTypeID === 'STEAM_TRAP3' ||
            device.devTypeID?.toLowerCase().includes('steamtrap') ||
            device.devTypeID?.toLowerCase().includes('steam')
          )
          setDevices(steamTrapDevices)
          
          // Load metadata for each device
          const metadataPromises = steamTrapDevices.map(async (device) => {
            try {
              const metadata = await dataAccess.getDeviceMetaData(device.devID)
              return { deviceId: device.devID, metadata }
            } catch (err) {
              console.error(`Failed to load metadata for device ${device.devID}:`, err)
              return null
            }
          })
          
          const metadataResults = await Promise.all(metadataPromises)
          const metadataMap: Record<string, any> = {}
          const finalSteamTrapDevices: DeviceDetail[] = []
          
          metadataResults.forEach((result) => {
            if (result && result.metadata) {
              const metadata = result.metadata as DeviceMetadata
              // Additional filtering based on metadata
              if (metadata.devTypeName?.toLowerCase().includes('steam trap') ||
                  metadata.devTypeName?.toLowerCase().includes('steamtrap') ||
                  metadata.devTypeID === 'STEAM_TRAP3' ||
                  metadata.devTypeID?.toLowerCase().includes('steamtrap')) {
                metadataMap[result.deviceId] = metadata
                const device = steamTrapDevices.find(d => d.devID === result.deviceId)
                if (device) {
                  finalSteamTrapDevices.push(device)
                }
              }
            }
          })
          
          setDevices(finalSteamTrapDevices)
          setDeviceMetadata(metadataMap)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load devices')
      } finally {
        setIsLoading(false)
      }
    }

    loadDevices()
  }, [dataAccess, setDevices, setDeviceMetadata, setIsLoading, setError])

  // Show settings modal if no config is set
  useEffect(() => {
    if (!config) {
      setIsSettingsOpen(true)
    }
  }, [config])

  // Filter devices to show only selected ones
  const displayDevices = devices.filter(device => selectedDevices.has(device.devID))
  
  const steamTrapDevices = displayDevices // All devices are already steam traps from filtering

  const getDeviceTypeStats = () => {
    const typeCount: Record<string, number> = {}
    displayDevices.forEach(device => {
      const deviceType = deviceMetadata[device.devID]?.devTypeName || device.devTypeID || 'Unknown'
      typeCount[deviceType] = (typeCount[deviceType] || 0) + 1
    })
    return typeCount
  }

  const deviceTypeStats = getDeviceTypeStats()

  const handleGlobalRefresh = () => {
    setIsRefreshing(true)
    // Trigger refresh for all DeviceDataCard components
    // This will be handled by a custom event
    window.dispatchEvent(new CustomEvent('refreshAllDevices'))
    
    // Reset refresh state after a short delay
    setTimeout(() => setIsRefreshing(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
                <Thermometer className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">SteamTrap ADR Dashboard</h1>
                <p className="text-sm text-gray-500">Real-time monitoring and analysis of steam trap performance</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleGlobalRefresh}
                disabled={isRefreshing}
                className="btn-secondary flex items-center space-x-2 px-3 py-2"
                title="Refresh all devices"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="btn-secondary flex items-center space-x-2 px-4 py-2"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                    <Database className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Selected Devices</p>
                    <p className="text-2xl font-semibold text-gray-900">{displayDevices.length}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                    <Thermometer className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Steam Traps</p>
                    <p className="text-2xl font-semibold text-gray-900">{steamTrapDevices.length}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg">
                    <Activity className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Monitoring</p>
                    <p className="text-2xl font-semibold text-gray-900">{displayDevices.length}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                    <Gauge className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Device Types</p>
                    <p className="text-2xl font-semibold text-gray-900">{Object.keys(deviceTypeStats).length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Device Table */}
            <div className="space-y-6">
              <DeviceDataTable
                devices={displayDevices}
                deviceMetadata={deviceMetadata}
              />
            </div>

            {displayDevices.length === 0 && (
              <div className="text-center py-12">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No devices selected</h3>
                <p className="text-gray-500">
                  {devices.length > 0 ? 'Please select devices from the settings to display them here.' : 'No steam trap devices found. Please check your configuration.'}
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}

export default Dashboard 