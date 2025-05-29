# SteamTrap ADR Dashboard

A modern React dashboard for monitoring and analyzing SteamTrap ADR (Automatic Data Recording) devices using the Faclon IoT platform.

## Features

- 🎛️ **Modern Dashboard Interface**: Clean, responsive design with Tailwind CSS
- ⚙️ **Settings Management**: Easy configuration of API credentials and settings
- 📊 **Device Overview**: View all connected devices with detailed information
- 🔍 **Device Filtering**: Automatic identification and filtering of steam trap devices
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- 🔒 **Secure Configuration**: Secure handling of API credentials
- 📈 **Real-time Data**: Live device status and sensor information

## Project Structure

```
steamtrap-adr-dashboard/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx          # Main dashboard component
│   │   ├── SettingsModal.tsx      # Settings configuration modal
│   │   ├── DeviceCard.tsx         # Individual device display card
│   │   ├── LoadingSpinner.tsx     # Loading indicator
│   │   └── ErrorAlert.tsx         # Error message display
│   ├── contexts/
│   │   └── ApiContext.tsx         # API state management
│   ├── App.tsx                    # Main application component
│   ├── main.tsx                   # Application entry point
│   └── index.css                  # Global styles
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## Prerequisites

- Node.js 16+ 
- npm, yarn, or pnpm
- Access to Faclon IoT platform with valid credentials

## Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd demo-react-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Install the connector library**:
   ```bash
   cd connector-userid-ts
   npm install
   npm run build
   cd ..
   ```

## Running the Application

1. **Start the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

2. **Open your browser** and navigate to `http://localhost:3000`

3. **Configure your API settings**:
   - The settings modal will open automatically on first run
   - Enter your Faclon IoT platform credentials:
     - **User ID**: Your Faclon user identifier
     - **Data URL**: Your data service endpoint
     - **DS URL**: Your device service endpoint
     - **Timezone**: Select your preferred timezone
     - **On-Premise**: Check if using on-premise installation

## Usage

### Settings Configuration

The dashboard includes a comprehensive settings modal with two tabs:

#### 1. User Configuration Tab
- **User ID**: Enter your Faclon platform user ID
- **Data URL**: Configure your data service endpoint
- **DS URL**: Configure your device service endpoint  
- **Timezone**: Select your preferred timezone for data display
- **On-Premise**: Toggle for on-premise installations

#### 2. Device Information Tab
- View all connected devices in a table format
- See device IDs, names, types, and sensor counts
- Get an overview of your device ecosystem

### Dashboard Features

#### Statistics Cards
- **Total Devices**: Count of all connected devices
- **Steam Traps**: Count of identified steam trap devices
- **Active Monitoring**: Number of actively monitored devices
- **Device Types**: Number of different device types

#### Device Grid
- Visual cards for each device showing:
  - Device name and ID
  - Device type and classification
  - Number of sensors
  - Location information (if available)
  - Date added
  - Sensor details

#### Steam Trap Identification
The dashboard automatically identifies steam trap devices by checking:
- Device type ID contains "steamtrap" or "steam"
- Device type name contains "steamtrap" or "steam"
- Special highlighting for steam trap devices

## API Integration

The dashboard uses the `connector-userid-ts` library to interact with the Faclon IoT platform:

- **Device Details**: Fetches all devices associated with your account
- **Device Metadata**: Retrieves detailed information for each device
- **Sensor Information**: Gets sensor configurations and capabilities
- **Real-time Data**: Supports real-time data queries (extensible)

## Building for Production

```bash
npm run build
# or
yarn build
# or
pnpm build
```

The built files will be in the `dist/` directory.

## Technology Stack

- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Full type safety and better development experience
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Beautiful, customizable icons
- **React Router**: Client-side routing
- **Faclon Connector**: TypeScript SDK for Faclon IoT platform

## Configuration Options

### Environment Variables (Optional)

You can set default values using environment variables:

```env
VITE_DEFAULT_USER_ID=your-default-user-id
VITE_DEFAULT_DATA_URL=your-default-data-url
VITE_DEFAULT_DS_URL=your-default-ds-url
```

### Customization

The dashboard is highly customizable:

- **Colors**: Modify `tailwind.config.js` to change the color scheme
- **Components**: All components are modular and can be easily modified
- **Layout**: Responsive grid system can be adjusted in the Dashboard component
- **Device Filtering**: Modify the steam trap detection logic in `Dashboard.tsx`

## Troubleshooting

### Common Issues

1. **Dependencies not installing**: Make sure you have Node.js 16+ installed
2. **API connection issues**: Verify your credentials in the settings modal
3. **Build errors**: Ensure TypeScript types are properly installed
4. **Styling issues**: Check that Tailwind CSS is properly configured

### Development Tips

- Use the browser's developer tools to inspect API calls
- Check the console for any error messages
- Verify that the connector library is properly built
- Ensure your API credentials have the necessary permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues related to:
- **Dashboard functionality**: Create an issue in this repository
- **API connectivity**: Check the connector-userid-ts documentation
- **Faclon platform**: Contact Faclon Labs support

---

**Built with ❤️ for the Faclon IoT ecosystem** 