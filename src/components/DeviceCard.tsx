import React from 'react'
import { Thermometer, Activity, MapPin, Calendar, Cpu } from 'lucide-react'

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

interface DeviceCardProps {
  device: DeviceDetail
  metadata?: DeviceMetadata
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, metadata }) => {
  const isSteamTrap = device.devTypeID?.toLowerCase().includes('steamtrap') ||
    device.devTypeID?.toLowerCase().includes('steam') ||
    metadata?.devTypeName?.toLowerCase().includes('steamtrap') ||
    metadata?.devTypeName?.toLowerCase().includes('steam')

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return 'N/A'
    }
  }

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
            isSteamTrap ? 'bg-green-100' : 'bg-blue-100'
          }`}>
            {isSteamTrap ? (
              <Thermometer className={`w-5 h-5 ${isSteamTrap ? 'text-green-600' : 'text-blue-600'}`} />
            ) : (
              <Cpu className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              {metadata?.devName || device.devID}
            </h3>
            <p className="text-xs text-gray-500">{device.devID}</p>
          </div>
        </div>
        
        {isSteamTrap && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Steam Trap
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center text-sm text-gray-600">
          <Activity className="w-4 h-4 mr-2 text-gray-400" />
          <span className="font-medium">Type:</span>
          <span className="ml-1">{metadata?.devTypeName || device.devTypeID || 'Unknown'}</span>
        </div>

        {metadata?.sensors && (
          <div className="flex items-center text-sm text-gray-600">
            <Cpu className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium">Sensors:</span>
            <span className="ml-1">{metadata.sensors.length}</span>
          </div>
        )}

        {metadata?.location && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium">Location:</span>
            <span className="ml-1 truncate">
              {metadata.location.latitude.toFixed(4)}, {metadata.location.longitude.toFixed(4)}
            </span>
          </div>
        )}

        {metadata?.addedOn && (
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium">Added:</span>
            <span className="ml-1">{formatDate(metadata.addedOn)}</span>
          </div>
        )}

        {metadata?.sensors && metadata.sensors.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-700 mb-2">Sensors:</p>
            <div className="flex flex-wrap gap-1">
              {metadata.sensors.slice(0, 3).map((sensor) => (
                <span
                  key={sensor.sensorId}
                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                >
                  {sensor.sensorName || sensor.sensorId}
                </span>
              ))}
              {metadata.sensors.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                  +{metadata.sensors.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DeviceCard 