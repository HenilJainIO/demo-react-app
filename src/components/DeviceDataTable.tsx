import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, RefreshCw, AlertCircle, Thermometer, TrendingUp, TrendingDown, Activity, Zap, Gauge, AlertTriangle, Filter } from 'lucide-react'
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

interface DeviceRowData {
  device: DeviceDetail
  metadata?: DeviceMetadata
  sensorData: SensorDataPoint[]
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
}

interface DeviceDataTableProps {
  devices: DeviceDetail[]
  deviceMetadata: Record<string, DeviceMetadata>
}

const DeviceDataTable: React.FC<DeviceDataTableProps> = ({ devices, deviceMetadata }) => {
  const { dataAccess } = useApi()
  const [deviceRows, setDeviceRows] = useState<Record<string, DeviceRowData>>({})
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  // Initialize device rows
  useEffect(() => {
    const initialRows: Record<string, DeviceRowData> = {}
    devices.forEach(device => {
      initialRows[device.devID] = {
        device,
        metadata: deviceMetadata[device.devID],
        sensorData: [],
        isLoading: false,
        error: null,
        lastUpdated: null
      }
    })
    setDeviceRows(initialRows)
  }, [devices, deviceMetadata])

  const fetchDeviceData = async (deviceId: string) => {
    if (!dataAccess) return

    setDeviceRows(prev => ({
      ...prev,
      [deviceId]: {
        ...prev[deviceId],
        isLoading: true,
        error: null
      }
    }))

    try {
      const data = await dataAccess.getDp({
        deviceId: deviceId,
        sensorList: null, // All sensors
        n: 1, // Latest reading only
        cal: true, // Apply calibration
        alias: true, // Use sensor names
        endTime: new Date()
      })

      setDeviceRows(prev => ({
        ...prev,
        [deviceId]: {
          ...prev[deviceId],
          sensorData: Array.isArray(data) ? data : [],
          isLoading: false,
          lastUpdated: new Date()
        }
      }))
    } catch (err) {
      console.error(`Error fetching data for device ${deviceId}:`, err)
      setDeviceRows(prev => ({
        ...prev,
        [deviceId]: {
          ...prev[deviceId],
          sensorData: [],
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch data'
        }
      }))
    }
  }

  const fetchAllDevicesData = async () => {
    setIsGlobalRefreshing(true)
    const promises = devices.map(device => fetchDeviceData(device.devID))
    await Promise.all(promises)
    setIsGlobalRefreshing(false)
  }

  // Auto-refresh every 30 minutes
  useEffect(() => {
    fetchAllDevicesData()
    const interval = setInterval(fetchAllDevicesData, 1800000)

    // Listen for global refresh events
    const handleGlobalRefresh = () => {
      fetchAllDevicesData()
    }
    
    window.addEventListener('refreshAllDevices', handleGlobalRefresh)

    return () => {
      clearInterval(interval)
      window.removeEventListener('refreshAllDevices', handleGlobalRefresh)
    }
  }, [devices, dataAccess])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFilterDropdown) {
        setShowFilterDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFilterDropdown])

  const toggleRowExpansion = (deviceId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(deviceId)) {
      newExpanded.delete(deviceId)
    } else {
      newExpanded.add(deviceId)
    }
    setExpandedRows(newExpanded)
  }

  const getSensorValue = (sensorData: SensorDataPoint[], sensorName: string): string => {
    const sensor = sensorData.find(data => 
      data.sensor?.toLowerCase().includes(sensorName.toLowerCase())
    )
    if (sensor?.value !== null && sensor?.value !== undefined) {
      return typeof sensor.value === 'number' ? sensor.value.toFixed(1) : String(sensor.value)
    }
    return 'N/A'
  }

  const getPressureValue = (sensorData: SensorDataPoint[], sensorName: string): string => {
    const sensor = sensorData.find(data => 
      data.sensor?.toLowerCase().includes(sensorName.toLowerCase()) ||
      data.sensor?.toLowerCase().includes('pressure')
    )
    if (sensor?.value !== null && sensor?.value !== undefined) {
      return typeof sensor.value === 'number' ? sensor.value.toFixed(1) : String(sensor.value)
    }
    return 'N/A'
  }

  // Mock baseline temperatures - in real implementation, these would come from device configuration
  const getBaselineTemperature = (deviceId: string, type: 'inlet' | 'outlet'): number => {
    // Mock baseline values - replace with actual baseline data from your system
    const baselines: Record<string, { inlet: number, outlet: number }> = {
      // Default baselines for steam traps
      default: { inlet: 254.25, outlet: 114.55 }
    }
    return baselines[deviceId]?.[type] || baselines.default[type]
  }

  const getTrapStatus = (sensorData: SensorDataPoint[]): { status: string, statusCode: number, color: string, description: string, icon: string } => {
    // Status mapping as provided
    const statusMapping: Record<string, { code: number, color: string, description: string, icon: string }> = {
      'Normal': { 
        code: 1, 
        color: 'text-green-600 bg-green-100', 
        description: 'Steam trap is operating normally with proper condensate discharge and no steam loss.',
        icon: '✓'
      },
      'Heavy Flooding': { 
        code: 3, 
        color: 'text-orange-600 bg-orange-100', 
        description: 'Steam trap is experiencing heavy flooding. Condensate is not being discharged properly.',
        icon: '⚠'
      },
      'Choking': { 
        code: 6, 
        color: 'text-red-600 bg-red-100', 
        description: 'Steam trap is choking. Flow is restricted and requires immediate attention.',
        icon: '⚠'
      },
      'Heavy Leak': { 
        code: 9, 
        color: 'text-red-600 bg-red-100', 
        description: 'Steam trap has a heavy leak. Steam is being lost and energy efficiency is compromised.',
        icon: '⚠'
      },
      'Valve Closed': { 
        code: 5, 
        color: 'text-gray-600 bg-gray-100', 
        description: 'Valve is closed. No flow is detected through the steam trap.',
        icon: '⚠'
      }
    }

    // Look for trap status or condition sensors
    const statusSensor = sensorData.find(data => 
      data.sensor?.toLowerCase().includes('status') ||
      data.sensor?.toLowerCase().includes('condition') ||
      data.sensor?.toLowerCase().includes('trap')
    )

    if (statusSensor?.value !== null && statusSensor?.value !== undefined) {
      const value = String(statusSensor.value)
      
      // Check if the value matches any of our status codes
      const statusCode = parseInt(value)
      for (const [statusName, statusInfo] of Object.entries(statusMapping)) {
        if (statusInfo.code === statusCode) {
          return {
            status: statusName,
            statusCode: statusInfo.code,
            color: statusInfo.color,
            description: statusInfo.description,
            icon: statusInfo.icon
          }
        }
      }
      
      // Check if the value matches status names
      for (const [statusName, statusInfo] of Object.entries(statusMapping)) {
        if (value.toLowerCase().includes(statusName.toLowerCase())) {
          return {
            status: statusName,
            statusCode: statusInfo.code,
            color: statusInfo.color,
            description: statusInfo.description,
            icon: statusInfo.icon
          }
        }
      }
    }

    // Fallback: analyze temperature difference for status determination
    const inletTemp = sensorData.find(data => 
      data.sensor?.toLowerCase().includes('inlet') && data.sensor?.toLowerCase().includes('temp')
    )
    const outletTemp = sensorData.find(data => 
      data.sensor?.toLowerCase().includes('outlet') && data.sensor?.toLowerCase().includes('temp')
    )

    if (inletTemp?.value && outletTemp?.value && 
        typeof inletTemp.value === 'number' && typeof outletTemp.value === 'number') {
      const tempDiff = inletTemp.value - outletTemp.value
      
      if (tempDiff > 100) {
        return statusMapping['Normal'] ? {
          status: 'Normal',
          statusCode: 1,
          ...statusMapping['Normal']
        } : {
          status: 'Normal',
          statusCode: 1,
          color: 'text-green-600 bg-green-100',
          description: 'Good temperature differential indicates proper steam trap operation.',
          icon: '✓'
        }
      } else if (tempDiff < 20) {
        return statusMapping['Heavy Flooding'] ? {
          status: 'Heavy Flooding',
          statusCode: 3,
          ...statusMapping['Heavy Flooding']
        } : {
          status: 'Heavy Flooding',
          statusCode: 3,
          color: 'text-orange-600 bg-orange-100',
          description: 'Low temperature differential suggests flooding condition.',
          icon: '⚠'
        }
      }
    }

    // Default to Normal status if no specific condition is detected
    return {
      status: 'Normal',
      statusCode: 1,
      color: 'text-green-600 bg-green-100',
      description: 'Steam trap appears to be operating normally.',
      icon: '✓'
    }
  }

  const formatLocation = (location?: { latitude: number, longitude: number }): string => {
    if (!location) return 'Location not available'
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
  }

  // Filter devices based on status
  const getFilteredDevices = () => {
    if (statusFilter === 'all') return devices
    
    return devices.filter(device => {
      const rowData = deviceRows[device.devID]
      if (!rowData || rowData.sensorData.length === 0) {
        return statusFilter === 'offline'
      }
      
      const status = getTrapStatus(rowData.sensorData)
      
      switch (statusFilter) {
        case 'normal':
          return status.statusCode === 1
        case 'warning':
          return status.statusCode === 3 || status.statusCode === 5
        case 'critical':
          return status.statusCode === 6 || status.statusCode === 9
        case 'offline':
          return false // Already handled above
        default:
          return true
      }
    })
  }

  const filteredDevices = getFilteredDevices()

  // Calculate KPIs
  const calculateKPIs = () => {
    const totalDevices = devices.length
    const devicesWithData = Object.values(deviceRows).filter(row => row.sensorData.length > 0).length
    const onlineDevices = Object.values(deviceRows).filter(row => !row.error && row.lastUpdated).length
    
    // Status distribution
    const statusCounts = { normal: 0, warning: 0, critical: 0, offline: 0 }
    let totalEnergyLoss = 0
    let avgTempDifferential = 0
    let tempDiffCount = 0
    
    Object.values(deviceRows).forEach(row => {
      if (row.sensorData.length > 0) {
        const status = getTrapStatus(row.sensorData)
        
        switch (status.statusCode) {
          case 1: // Normal
            statusCounts.normal++
            break
          case 3: // Heavy Flooding
          case 5: // Valve Closed
            statusCounts.warning++
            break
          case 6: // Choking
          case 9: // Heavy Leak
            statusCounts.critical++
            // Estimate energy loss for critical issues
            totalEnergyLoss += status.statusCode === 9 ? 15 : 10 // kW estimated loss
            break
          default:
            statusCounts.warning++
        }
        
        // Calculate temperature differential
        const inletTemp = row.sensorData.find(data => 
          data.sensor?.toLowerCase().includes('inlet') && data.sensor?.toLowerCase().includes('temp')
        )
        const outletTemp = row.sensorData.find(data => 
          data.sensor?.toLowerCase().includes('outlet') && data.sensor?.toLowerCase().includes('temp')
        )
        
        if (inletTemp?.value && outletTemp?.value && 
            typeof inletTemp.value === 'number' && typeof outletTemp.value === 'number') {
          avgTempDifferential += (inletTemp.value - outletTemp.value)
          tempDiffCount++
        }
      } else {
        statusCounts.offline++
      }
    })
    
    avgTempDifferential = tempDiffCount > 0 ? avgTempDifferential / tempDiffCount : 0
    const efficiency = totalDevices > 0 ? ((statusCounts.normal / totalDevices) * 100) : 0
    const uptime = totalDevices > 0 ? ((onlineDevices / totalDevices) * 100) : 0
    
    return {
      totalDevices,
      onlineDevices,
      efficiency: efficiency.toFixed(1),
      uptime: uptime.toFixed(1),
      statusCounts,
      totalEnergyLoss: totalEnergyLoss.toFixed(1),
      avgTempDifferential: avgTempDifferential.toFixed(1),
      lastUpdated: new Date()
    }
  }

  const kpis = calculateKPIs()

  if (devices.length === 0) {
    return (
      <div className="text-center py-8">
        <Thermometer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No devices selected</h3>
        <p className="text-gray-500">Please select devices from the settings to display them here.</p>
      </div>
    )
  }

  if (filteredDevices.length === 0 && statusFilter !== 'all') {
    return (
      <div className="space-y-6">
        {/* KPI Dashboard */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Steam Trap Performance Overview</h2>
            <div className="text-sm text-gray-500">
              Last updated: {kpis.lastUpdated.toLocaleTimeString()}
            </div>
          </div>
          
          {/* Main KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* System Efficiency */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">System Efficiency</p>
                  <p className="text-2xl font-bold text-green-900">{kpis.efficiency}%</p>
                  <p className="text-xs text-green-600">
                    {kpis.statusCounts.normal} of {kpis.totalDevices} operating normally
                  </p>
                </div>
                <div className="p-2 bg-green-200 rounded-full">
                  <Gauge className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </div>

            {/* System Uptime */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">System Uptime</p>
                  <p className="text-2xl font-bold text-blue-900">{kpis.uptime}%</p>
                  <p className="text-xs text-blue-600">
                    {kpis.onlineDevices} of {kpis.totalDevices} devices online
                  </p>
                </div>
                <div className="p-2 bg-blue-200 rounded-full">
                  <Activity className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </div>

            {/* Energy Loss */}
            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800">Estimated Energy Loss</p>
                  <p className="text-2xl font-bold text-red-900">{kpis.totalEnergyLoss} kW</p>
                  <p className="text-xs text-red-600">
                    From {kpis.statusCounts.critical} critical issues
                  </p>
                </div>
                <div className="p-2 bg-red-200 rounded-full">
                  <Zap className="w-6 h-6 text-red-700" />
                </div>
              </div>
            </div>

            {/* Avg Temperature Differential */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800">Avg Temp Differential</p>
                  <p className="text-2xl font-bold text-orange-900">{kpis.avgTempDifferential}°C</p>
                  <p className="text-xs text-orange-600">
                    Across all active traps
                  </p>
                </div>
                <div className="p-2 bg-orange-200 rounded-full">
                  <Thermometer className="w-6 h-6 text-orange-700" />
                </div>
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Status Distribution</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-700">Normal Operation</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{kpis.statusCounts.normal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-700">Warning Status</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{kpis.statusCounts.warning}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-700">Critical Issues</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{kpis.statusCounts.critical}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-700">Offline/No Data</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{kpis.statusCounts.offline}</span>
                </div>
              </div>
            </div>

            {/* Insights & Recommendations */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Key Insights</h3>
              <div className="space-y-2">
                {kpis.statusCounts.critical > 0 && (
                  <div className="flex items-start">
                    <AlertTriangle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      {kpis.statusCounts.critical} trap(s) require immediate attention
                    </span>
                  </div>
                )}
                {parseFloat(kpis.efficiency) < 80 && (
                  <div className="flex items-start">
                    <TrendingDown className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      System efficiency below optimal (80%+)
                    </span>
                  </div>
                )}
                {parseFloat(kpis.efficiency) >= 90 && (
                  <div className="flex items-start">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      Excellent system performance maintained
                    </span>
                  </div>
                )}
                {parseFloat(kpis.totalEnergyLoss) > 20 && (
                  <div className="flex items-start">
                    <Zap className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      High energy loss detected - review critical traps
                    </span>
                  </div>
                )}
                {parseFloat(kpis.avgTempDifferential) < 50 && (
                  <div className="flex items-start">
                    <Thermometer className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      Low average temperature differential detected
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Device Data Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Filter Controls */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="text-sm font-medium text-gray-900">Device Status</h3>
                <div className="relative">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
                      {statusFilter === 'all' ? 'All Status' : 
                       statusFilter === 'normal' ? 'Normal' :
                       statusFilter === 'warning' ? 'Warning' :
                       statusFilter === 'critical' ? 'Critical' :
                       statusFilter === 'offline' ? 'Offline' : 'All Status'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                  
                  {showFilterDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      <div className="py-1">
                        {[
                          { value: 'all', label: 'All Status', count: devices.length },
                          { value: 'normal', label: 'Normal', count: kpis.statusCounts.normal },
                          { value: 'warning', label: 'Warning', count: kpis.statusCounts.warning },
                          { value: 'critical', label: 'Critical', count: kpis.statusCounts.critical },
                          { value: 'offline', label: 'Offline', count: kpis.statusCounts.offline }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setStatusFilter(option.value)
                              setShowFilterDropdown(false)
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${
                              statusFilter === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                          >
                            <span>{option.label}</span>
                            <span className="text-xs text-gray-500">({option.count})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                Showing {filteredDevices.length} of {devices.length} devices
              </div>
            </div>
          </div>
          
          <div className="text-center py-12">
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No devices match the current filter</h3>
            <p className="text-gray-500">
              Try selecting a different status filter or clear the current filter to see all devices.
            </p>
            <button
              onClick={() => setStatusFilter('all')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Show All Devices
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Dashboard */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Steam Trap Performance Overview</h2>
          <div className="text-sm text-gray-500">
            Last updated: {kpis.lastUpdated.toLocaleTimeString()}
          </div>
        </div>
        
        {/* Main KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* System Efficiency */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">System Efficiency</p>
                <p className="text-2xl font-bold text-green-900">{kpis.efficiency}%</p>
                <p className="text-xs text-green-600">
                  {kpis.statusCounts.normal} of {kpis.totalDevices} operating normally
                </p>
              </div>
              <div className="p-2 bg-green-200 rounded-full">
                <Gauge className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </div>

          {/* System Uptime */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">System Uptime</p>
                <p className="text-2xl font-bold text-blue-900">{kpis.uptime}%</p>
                <p className="text-xs text-blue-600">
                  {kpis.onlineDevices} of {kpis.totalDevices} devices online
                </p>
              </div>
              <div className="p-2 bg-blue-200 rounded-full">
                <Activity className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </div>

          {/* Energy Loss */}
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Estimated Energy Loss</p>
                <p className="text-2xl font-bold text-red-900">{kpis.totalEnergyLoss} kW</p>
                <p className="text-xs text-red-600">
                  From {kpis.statusCounts.critical} critical issues
                </p>
              </div>
              <div className="p-2 bg-red-200 rounded-full">
                <Zap className="w-6 h-6 text-red-700" />
              </div>
            </div>
          </div>

          {/* Avg Temperature Differential */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Avg Temp Differential</p>
                <p className="text-2xl font-bold text-orange-900">{kpis.avgTempDifferential}°C</p>
                <p className="text-xs text-orange-600">
                  Across all active traps
                </p>
              </div>
              <div className="p-2 bg-orange-200 rounded-full">
                <Thermometer className="w-6 h-6 text-orange-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Status Distribution</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Normal Operation</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{kpis.statusCounts.normal}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Warning Status</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{kpis.statusCounts.warning}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Critical Issues</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{kpis.statusCounts.critical}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Offline/No Data</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{kpis.statusCounts.offline}</span>
              </div>
            </div>
          </div>

          {/* Insights & Recommendations */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Key Insights</h3>
            <div className="space-y-2">
              {kpis.statusCounts.critical > 0 && (
                <div className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    {kpis.statusCounts.critical} trap(s) require immediate attention
                  </span>
                </div>
              )}
              {parseFloat(kpis.efficiency) < 80 && (
                <div className="flex items-start">
                  <TrendingDown className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    System efficiency below optimal (80%+)
                  </span>
                </div>
              )}
              {parseFloat(kpis.efficiency) >= 90 && (
                <div className="flex items-start">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Excellent system performance maintained
                  </span>
                </div>
              )}
              {parseFloat(kpis.totalEnergyLoss) > 20 && (
                <div className="flex items-start">
                  <Zap className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    High energy loss detected - review critical traps
                  </span>
                </div>
              )}
              {parseFloat(kpis.avgTempDifferential) < 50 && (
                <div className="flex items-start">
                  <Thermometer className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Low average temperature differential detected
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Device Data Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Filter Controls */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-sm font-medium text-gray-900">Device Status</h3>
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">
                    {statusFilter === 'all' ? 'All Status' : 
                     statusFilter === 'normal' ? 'Normal' :
                     statusFilter === 'warning' ? 'Warning' :
                     statusFilter === 'critical' ? 'Critical' :
                     statusFilter === 'offline' ? 'Offline' : 'All Status'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                
                {showFilterDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    <div className="py-1">
                      {[
                        { value: 'all', label: 'All Status', count: devices.length },
                        { value: 'normal', label: 'Normal', count: kpis.statusCounts.normal },
                        { value: 'warning', label: 'Warning', count: kpis.statusCounts.warning },
                        { value: 'critical', label: 'Critical', count: kpis.statusCounts.critical },
                        { value: 'offline', label: 'Offline', count: kpis.statusCounts.offline }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setStatusFilter(option.value)
                            setShowFilterDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${
                            statusFilter === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <span>{option.label}</span>
                          <span className="text-xs text-gray-500">({option.count})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              Showing {filteredDevices.length} of {devices.length} devices
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name<br/>
                  <span className="text-gray-400 normal-case">Location</span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pressure<br/>
                  <div className="flex justify-between mt-1 text-gray-400 normal-case text-xs">
                    <span>Inlet (kg/cm²)</span>
                    <span>Outlet (kg/cm²)</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-100">
                  Base Line Temperature<br/>
                  <div className="flex justify-between mt-1 text-gray-400 normal-case text-xs">
                    <span>Inlet (°C)</span>
                    <span>Outlet (°C)</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Live Temperature<br/>
                  <div className="flex justify-between mt-1 text-gray-400 normal-case text-xs">
                    <span>Inlet (°C)</span>
                    <span>Outlet (°C)</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                  {/* Actions */}
                </th>
              </tr>
            </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
            {filteredDevices.map((device) => {
                const rowData = deviceRows[device.devID]
                const isExpanded = expandedRows.has(device.devID)
                const trapStatus = rowData ? getTrapStatus(rowData.sensorData) : { 
                  status: 'Loading...', 
                  statusCode: 0,
                  color: 'text-gray-500 bg-gray-100', 
                  description: '',
                  icon: '...'
                }
                const baselineInlet = getBaselineTemperature(device.devID, 'inlet')
                const baselineOutlet = getBaselineTemperature(device.devID, 'outlet')

                return (
                  <React.Fragment key={device.devID}>
                    <tr className="hover:bg-gray-50 transition-colors border-b">
                      <td className="px-3 py-3 whitespace-nowrap">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {rowData?.metadata?.devName || device.devID}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatLocation(rowData?.metadata?.location)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-900">
                            {rowData?.isLoading ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                            ) : (
                              getPressureValue(rowData?.sensorData || [], 'inlet')
                            )}
                          </span>
                          <span className="text-sm text-gray-900">
                            {rowData?.isLoading ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                            ) : (
                              getPressureValue(rowData?.sensorData || [], 'outlet')
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center bg-blue-50">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-900 font-medium">
                            {baselineInlet.toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-900 font-medium">
                            {baselineOutlet.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-900">
                            {rowData?.isLoading ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                            ) : (
                              getSensorValue(rowData?.sensorData || [], 'inlet')
                            )}
                          </span>
                          <span className="text-sm text-gray-900">
                            {rowData?.isLoading ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                            ) : (
                              getSensorValue(rowData?.sensorData || [], 'outlet')
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {rowData?.isLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                        ) : (
                          <div className="flex items-center justify-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${trapStatus.color}`}>
                              {trapStatus.icon} {trapStatus.status}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => toggleRowExpansion(device.devID)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                          <button className="text-gray-400 hover:text-gray-600 transition-colors">
                            <span className="text-lg">⋮</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Status Information</h4>
                                <div className="bg-white rounded-lg p-4 border">
                                  <div className="flex items-center mb-2">
                                    <span className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${trapStatus.color}`}>
                                      {trapStatus.icon} {trapStatus.status} (Code: {trapStatus.statusCode})
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700">{trapStatus.description}</p>
                                  {rowData?.lastUpdated && (
                                    <div className="text-xs text-gray-500 mt-2">
                                      Last updated: {rowData.lastUpdated.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Temperature Analysis</h4>
                                <div className="bg-white rounded-lg p-4 border">
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-600">Baseline Inlet:</span>
                                      <span className="text-sm font-medium">{baselineInlet.toFixed(2)}°C</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-600">Live Inlet:</span>
                                      <span className="text-sm font-medium">{getSensorValue(rowData?.sensorData || [], 'inlet')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-600">Baseline Outlet:</span>
                                      <span className="text-sm font-medium">{baselineOutlet.toFixed(2)}°C</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-600">Live Outlet:</span>
                                      <span className="text-sm font-medium">{getSensorValue(rowData?.sensorData || [], 'outlet')}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {rowData?.sensorData && rowData.sensorData.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">All Sensor Readings</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {rowData.sensorData.map((dataPoint, index) => (
                                    <div key={index} className="bg-white rounded-lg p-3 border">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">
                                          {dataPoint.sensor || 'Unknown Sensor'}
                                        </span>
                                        <span className="text-sm font-semibold text-gray-900">
                                          {dataPoint.value !== null && dataPoint.value !== undefined 
                                            ? (typeof dataPoint.value === 'number' ? dataPoint.value.toFixed(2) : String(dataPoint.value))
                                            : 'N/A'
                                          }
                                        </span>
                                      </div>
                                      {dataPoint.time && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          {new Date(dataPoint.time).toLocaleString()}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {rowData?.error && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <div className="flex items-center">
                                  <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                                  <span className="text-sm text-red-700">{rowData.error}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default DeviceDataTable 