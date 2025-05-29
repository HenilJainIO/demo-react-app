import React, { useState, useEffect } from 'react'
import { Thermometer, Activity, RefreshCw, AlertCircle, Clock } from 'lucide-react'
import { useApi } from '../contexts/ApiContext'

interface DeviceDetail {
  devID: string
  devTypeID: string
}

interface SensorInfo {
  sensorId: string
  sensorName: string
}

interface DeviceMetadata {
  _id: string
  devID: string
  devName: string
  devTypeID: string
  devTypeName: string
  sensors: SensorInfo[]
  location?: {
    latitude: number
    longitude: number
  }
  addedOn: string
}

interface SensorDataPoint {
  time: string | number
  sensor: string
  value: string | number | null
}

interface DeviceDataCardProps {
  device: DeviceDetail
  metadata?: DeviceMetadata
}

const DeviceDataCard: React.FC<DeviceDataCardProps> = ({ device, metadata }) => {
  const { dataAccess } = useApi()
  const [sensorData, setSensorData] = useState<SensorDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const isSteamTrap = device.devTypeID?.toLowerCase().includes('steamtrap') ||
    device.devTypeID?.toLowerCase().includes('steam') ||
    metadata?.devTypeName?.toLowerCase().includes('steamtrap') ||
    metadata?.devTypeName?.toLowerCase().includes('steam')

  const fetchLatestData = async () => {
    if (!dataAccess) return

    setIsLoading(true)
    setError(null)

    try {
      // Get latest datapoint for all sensors (sensorList: null means all sensors)
      const data = await dataAccess.getDp({
        deviceId: device.devID,
        sensorList: null, // All sensors
        n: 1, // Just one row (latest)
        cal: true, // Apply calibration
        alias: true, // Use sensor names
        endTime: new Date() // Up to current time
      })

      if (Array.isArray(data) && data.length > 0) {
        setSensorData(data)
        setLastUpdated(new Date())
      } else {
        setSensorData([])
      }
    } catch (err) {
      console.error(`Error fetching data for device ${device.devID}:`, err)
      setError(err instanceof Error ? err.message : 'Failed to fetch sensor data')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data on component mount and set up auto-refresh
  useEffect(() => {
    fetchLatestData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLatestData, 30000)
    
    // Listen for global refresh events
    const handleGlobalRefresh = () => {
      fetchLatestData()
    }
    
    window.addEventListener('refreshAllDevices', handleGlobalRefresh)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('refreshAllDevices', handleGlobalRefresh)
    }
  }, [dataAccess, device.devID])

  const formatValue = (value: string | number | null): string => {
    if (value === null || value === undefined) return 'N/A'
    if (typeof value === 'number') {
      return value.toFixed(2)
    }
    return String(value)
  }

  const formatTimestamp = (timestamp: string | number): string => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleString()
    } catch {
      return 'Invalid time'
    }
  }

  const getStatusColor = (value: string | number | null): string => {
    if (value === null || value === undefined) return 'text-gray-500'
    if (typeof value === 'number') {
      // Simple status logic - you can customize this based on your requirements
      if (value > 100) return 'text-red-600' // High value
      if (value > 50) return 'text-yellow-600' // Medium value
      return 'text-green-600' // Normal value
    }
    return 'text-blue-600'
  }

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
            isSteamTrap ? 'bg-green-100' : 'bg-blue-100'
          }`}>
            {isSteamTrap ? (
              <Thermometer className="w-5 h-5 text-green-600" />
            ) : (
              <Activity className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              {metadata?.devName || device.devID}
            </h3>
            <p className="text-xs text-gray-500">{device.devID}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isSteamTrap && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Steam Trap
            </span>
          )}
          <button
            onClick={fetchLatestData}
            disabled={isLoading}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="flex items-center text-xs text-gray-500 mb-3">
          <Clock className="w-3 h-3 mr-1" />
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center text-sm text-red-600 mb-3">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-400 mr-2" />
          <span className="text-sm text-gray-500">Loading sensor data...</span>
        </div>
      )}

      {/* Sensor Data */}
      {!isLoading && sensorData.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Latest Sensor Readings</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid gap-2">
              {sensorData.map((dataPoint, index) => (
                <div key={index} className="flex justify-between items-center py-1">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">
                      {dataPoint.sensor || 'Unknown Sensor'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-semibold ${getStatusColor(dataPoint.value)}`}>
                      {formatValue(dataPoint.value)}
                    </span>
                    {dataPoint.time && (
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(dataPoint.time)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!isLoading && !error && sensorData.length === 0 && (
        <div className="text-center py-4">
          <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No sensor data available</p>
        </div>
      )}

      {/* Device Info Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Type: {metadata?.devTypeName || device.devTypeID || 'Unknown'}</span>
          <span>Sensors: {metadata?.sensors?.length || 0}</span>
        </div>
      </div>
    </div>
  )
}

export default DeviceDataCard 