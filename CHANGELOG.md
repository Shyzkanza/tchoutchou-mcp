# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2025-11-17

### Added
- Enhanced map popups to differentiate between boarding stops (🔼 Montée), alighting stops (🔽 Descente), pass-through stops (⚬ Passage), and transfers (🔄 Correspondance)

### Fixed
- Fixed map tiles not loading in DeparturesViewer and ArrivalsViewer (broken image icons issue)
- MapModal now properly renders MapContent component with route polylines and markers

### Changed
- Optimized JourneyViewer interface by factorizing repetitive styles into constants
- Removed debug information section from JourneyViewer to reduce token consumption in ChatGPT conversations
- Reduced JourneyViewer code size by ~13% (from 825 to 719 lines) while maintaining full functionality

## [1.0.1] - 2025-11-16

### Changed
- Translated all documentation from French to English
- Updated README with comprehensive English documentation
- Minor documentation improvements

## [1.0.0] - 2025-11-15

### Added
- Initial public release with npm publication under @shyzus/tchoutchou-mcp scope
- Complete MCP server for French train search powered by Navitia API
- Interactive React UI components for ChatGPT integration
- Station search functionality
- Real-time departures and arrivals
- Journey planning with interactive maps
- Address search and geocoding
- Nearby places search
- GitHub Actions CI/CD pipeline for automated deployment
- Docker support with Portainer integration
- Health check endpoint
- Production server deployment

### Features
- **JourneyViewer**: Interactive map with route comparison, tabs, and adaptive zoom
- **DeparturesViewer**: Real-time departures with schedules, delays, platforms, and route maps
- **ArrivalsViewer**: Real-time arrivals with origin, schedules, delays, and route maps
- **AddressMapViewer**: Display locations on interactive Leaflet maps
- Full screen mode for all map interfaces
- Detailed schedules, connections, and intermediate stops
- Support for multiple MCP clients (ChatGPT, Claude Desktop, Cursor, Warp)
