import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { DataAccess, DeviceDetail, DeviceMetadata } from 'connector-userid-ts'

interface ApiConfig {
  userId: string
  dataUrl: string
  dsUrl: string
  onPrem?: boolean
  tz?: string
}

interface ApiContextType {
  config: ApiConfig | null
  setConfig: (config: ApiConfig) => void
  dataAccess: DataAccess | null
  devices: DeviceDetail[]
  setDevices: (devices: DeviceDetail[]) => void
  deviceMetadata: Record<string, DeviceMetadata>
  setDeviceMetadata: (metadata: Record<string, DeviceMetadata>) => void
  selectedDevices: Set<string>
  setSelectedDevices: (devices: Set<string>) => void
  clearStoredData: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
}

const ApiContext = createContext<ApiContextType | undefined>(undefined)

export const useApi = () => {
  const context = useContext(ApiContext)
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider')
  }
  return context
}

interface ApiProviderProps {
  children: ReactNode
}

export const ApiProvider: React.FC<ApiProviderProps> = ({ children }) => {
  const [config, setConfigState] = useState<ApiConfig | null>(() => {
    // Load config from localStorage, fallback to defaults
    try {
      const saved = localStorage.getItem('steamtrap-api-config')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error loading config from localStorage:', error)
    }
    // Default configuration
    return {
      userId: '6582ae855711ae5df30ee386',
      dataUrl: 'datads.iosense.io',
      dsUrl: 'ds-server.iosense.io',
      onPrem: false,
      tz: 'UTC'
    }
  })
  const [dataAccess, setDataAccess] = useState<DataAccess | null>(null)
  const [devices, setDevices] = useState<DeviceDetail[]>([])
  const [deviceMetadata, setDeviceMetadata] = useState<Record<string, DeviceMetadata>>({})
  const [selectedDevices, setSelectedDevicesState] = useState<Set<string>>(() => {
    // Load selected devices from localStorage on initialization
    try {
      const saved = localStorage.getItem('steamtrap-selected-devices')
      if (saved) {
        const deviceIds = JSON.parse(saved)
        return new Set(deviceIds)
      }
    } catch (error) {
      console.error('Error loading selected devices from localStorage:', error)
    }
    return new Set()
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize DataAccess when config is available
  useEffect(() => {
    if (config && !dataAccess) {
      const newDataAccess = new DataAccess({
        userId: config.userId,
        dataUrl: config.dataUrl,
        dsUrl: config.dsUrl,
        onPrem: config.onPrem || false,
        tz: config.tz || 'UTC'
      })
      setDataAccess(newDataAccess)
    }
  }, [config, dataAccess])

  // Wrapper function to save selected devices to localStorage
  const setSelectedDevices = (devices: Set<string>) => {
    setSelectedDevicesState(devices)
    try {
      localStorage.setItem('steamtrap-selected-devices', JSON.stringify(Array.from(devices)))
    } catch (error) {
      console.error('Error saving selected devices to localStorage:', error)
    }
  }

  // Function to clear all stored data
  const clearStoredData = () => {
    try {
      localStorage.removeItem('steamtrap-selected-devices')
      localStorage.removeItem('steamtrap-api-config')
      setSelectedDevicesState(new Set())
      // Reset to default config
      const defaultConfig = {
        userId: '6582ae855711ae5df30ee386',
        dataUrl: 'datads.iosense.io',
        dsUrl: 'ds-server.iosense.io',
        onPrem: false,
        tz: 'UTC'
      }
      setConfigState(defaultConfig)
    } catch (error) {
      console.error('Error clearing stored data:', error)
    }
  }

  const setConfig = (newConfig: ApiConfig) => {
    setConfigState(newConfig)
    // Save config to localStorage
    try {
      localStorage.setItem('steamtrap-api-config', JSON.stringify(newConfig))
    } catch (error) {
      console.error('Error saving config to localStorage:', error)
    }
    
    const newDataAccess = new DataAccess({
      userId: newConfig.userId,
      dataUrl: newConfig.dataUrl,
      dsUrl: newConfig.dsUrl,
      onPrem: newConfig.onPrem || false,
      tz: newConfig.tz || 'UTC'
    })
    setDataAccess(newDataAccess)
  }

  const value: ApiContextType = {
    config,
    setConfig,
    dataAccess,
    devices,
    setDevices,
    deviceMetadata,
    setDeviceMetadata,
    selectedDevices,
    setSelectedDevices,
    clearStoredData,
    isLoading,
    setIsLoading,
    error,
    setError
  }

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  )
} 