const cableReferenceColumns = [
  'Icon', 'Cable', 'Family', 'Version', 'Year', 'Connectors', 'Contacts', 'Signal',
  'Rate', 'Video', 'Audio', 'Power', 'Length', 'Impedance', 'Shielding',
  'Compatibility', 'Notes', 'Source'
];

const cableReferenceGroups = [
  {
    family: 'USB',
    source: 'https://en.wikipedia.org/wiki/USB',
    defaults: {
      connectors: 'Type-A / Type-B', contacts: '4', signal: 'Differential serial',
      video: 'No native video', audio: 'USB audio devices', power: '5 V bus power',
      length: 'Cable-dependent', impedance: '90 ohm differential', shielding: 'Shielded',
      compatibility: 'Lowest shared USB mode'
    },
    rows: [
      { name: 'USB 1.0 Low-Speed', version: '1.0', year: 1996, rate: '1.5 Mb/s', length: '3 m', shielding: 'Unshielded permitted', notes: 'Low-Speed devices normally use captive cables' },
      { name: 'USB 1.0 Full-Speed', version: '1.0', year: 1996, rate: '12 Mb/s', length: '5 m', notes: 'Original USB specification' },
      { name: 'USB 1.1 Low-Speed', version: '1.1', year: 1998, rate: '1.5 Mb/s', length: '3 m', shielding: 'Unshielded permitted', notes: 'Clarifications to USB 1.0' },
      { name: 'USB 1.1 Full-Speed', version: '1.1', year: 1998, rate: '12 Mb/s', length: '5 m', notes: 'Same maximum rate as USB 1.0' },
      { name: 'USB 2.0 High-Speed', version: '2.0', year: 2000, connectors: 'A / B / Mini / Micro / C', contacts: 'Connector-dependent', rate: '480 Mb/s', length: '5 m for standard A-B', power: '5 V, 500 mA configured device', notes: 'USB-C can carry only USB 2.0 despite its connector shape' },
      { name: 'USB 3.0 SuperSpeed', version: '3.0', year: 2008, connectors: 'SuperSpeed A / B / Micro-B', contacts: '9 / 9 / 10', rate: '5 Gb/s', power: '5 V, 900 mA configured device', notes: 'Later renamed USB 3.1 Gen 1 and USB 3.2 Gen 1x1' },
      { name: 'USB 3.1 Gen 1', version: '3.1 Gen 1', year: 2013, connectors: 'SuperSpeed A / B / Micro-B / C', contacts: 'Connector-dependent', rate: '5 Gb/s', power: 'USB bus power, PD optional', notes: 'Same signaling mode as USB 3.0' },
      { name: 'USB 3.1 Gen 2', version: '3.1 Gen 2', year: 2013, connectors: 'SuperSpeed A / B / Micro-B / C', contacts: 'Connector-dependent', rate: '10 Gb/s', power: 'USB bus power, PD optional', notes: '128b/132b encoding, later USB 3.2 Gen 2x1' },
      { name: 'USB 3.2 Gen 1x1', version: '3.2 Gen 1x1', year: 2017, connectors: 'SuperSpeed A / B / Micro-B / C', contacts: 'Connector-dependent', rate: '5 Gb/s', power: 'USB bus power, PD optional', notes: 'One 5 Gb/s lane in each direction' },
      { name: 'USB 3.2 Gen 1x2', version: '3.2 Gen 1x2', year: 2017, connectors: 'USB-C', contacts: '24 at receptacle', rate: '10 Gb/s', power: 'USB-C / PD negotiated', notes: 'Two 5 Gb/s lanes in each direction, uncommon' },
      { name: 'USB 3.2 Gen 2x1', version: '3.2 Gen 2x1', year: 2017, connectors: 'SuperSpeed A / B / Micro-B / C', contacts: 'Connector-dependent', rate: '10 Gb/s', power: 'USB bus power, PD optional', notes: 'One 10 Gb/s lane in each direction' },
      { name: 'USB 3.2 Gen 2x2', version: '3.2 Gen 2x2', year: 2017, connectors: 'USB-C', contacts: '24 at receptacle', rate: '20 Gb/s', power: 'USB-C / PD negotiated', notes: 'Two 10 Gb/s lanes in each direction, not guaranteed by USB4 ports' },
      { name: 'USB4 20Gbps', version: '1.0, Gen 2x2', year: 2019, connectors: 'USB-C', contacts: '24 at receptacle', rate: '20 Gb/s', video: 'DisplayPort tunneling', power: 'USB-C / PD negotiated', notes: 'Shared bandwidth for data and display traffic' },
      { name: 'USB4 40Gbps', version: '1.0, Gen 3x2', year: 2019, connectors: 'USB-C', contacts: '24 at receptacle', rate: '40 Gb/s', video: 'DisplayPort tunneling', power: 'USB-C / PD negotiated', notes: 'Use a cable rated for the required USB4 performance' },
      { name: 'USB4 80Gbps', version: '2.0, Gen 4x2', year: 2022, connectors: 'USB-C', contacts: '24 at receptacle', rate: '80 Gb/s', video: 'DisplayPort tunneling', power: 'USB-C / PD negotiated', notes: 'PAM3 signaling, can use compliant passive 40 Gb/s cables' },
      { name: 'USB4 asymmetric', version: '2.0, Gen 4x3', year: 2022, connectors: 'USB-C', contacts: '24 at receptacle', rate: '120 / 40 Gb/s', video: 'DisplayPort tunneling', power: 'USB-C / PD negotiated', notes: 'Optional 120 Gb/s in one direction and 40 Gb/s in the other' }
    ]
  },
  {
    family: 'USB connectors and power',
    source: 'https://en.wikipedia.org/wiki/USB_hardware',
    defaults: {
      year: 'Not specified', signal: 'USB, cable-dependent', rate: 'Cable-dependent',
      video: 'No native video', audio: 'USB audio devices', power: 'Mode-dependent',
      length: 'Cable-dependent', impedance: '90 ohm differential for USB data', shielding: 'Cable-dependent',
      compatibility: 'Connector shape does not establish speed'
    },
    rows: [
      { name: 'USB Type-A', version: 'USB 2.0 / SuperSpeed', connectors: 'Type-A', contacts: '4 / 9', notes: 'Host connector, not reversible' },
      { name: 'USB Type-B', version: 'USB 2.0 / SuperSpeed', connectors: 'Type-B', contacts: '4 / 9', notes: 'SuperSpeed Type-B plug does not fit a USB 2.0 Type-B socket' },
      { name: 'USB Mini-A', version: 'USB 2.0 OTG', connectors: 'Mini-A', contacts: '5', notes: 'Deprecated connector, host-role ID contact' },
      { name: 'USB Mini-B', version: 'USB 2.0', connectors: 'Mini-B', contacts: '5', rate: '480 Mb/s', notes: 'Legacy cameras, controllers and audio devices' },
      { name: 'USB Micro-A', version: 'USB 2.0 OTG', connectors: 'Micro-A', contacts: '5', notes: 'Host-role plug for a Micro-AB receptacle' },
      { name: 'USB Micro-B', version: 'USB 2.0 / SuperSpeed', connectors: 'Micro-B', contacts: '5 / 10', notes: 'SuperSpeed variant has a wider two-part connector' },
      { name: 'USB Type-C', version: 'Type-C connector', year: 2014, connectors: 'USB-C', contacts: '24 at receptacle', video: 'DP Alt Mode / USB4 if supported', power: 'Up to 240 W with suitable PD equipment', notes: 'Reversible connector, speed, video and power ratings are independent' },
      { name: 'USB Battery Charging', version: 'BC 1.2', year: 2010, connectors: 'USB A / B / Micro', contacts: 'Connector-dependent', power: '5 V, up to 1.5 A', notes: 'Charging-port classification, not a faster data version' },
      { name: 'USB Power Delivery 1.0', version: 'PD 1.0', year: 2012, connectors: 'PD-capable USB A / B', contacts: 'Connector-dependent', power: 'Up to 100 W', notes: 'Original PD used signaling on VBUS' },
      { name: 'USB Power Delivery 2.0', version: 'PD 2.0', year: 2014, connectors: 'USB-C', contacts: '24 at receptacle', power: 'Up to 100 W', notes: 'USB-C PD communicates over the CC contact' },
      { name: 'USB Power Delivery 3.0', version: 'PD 3.0', year: 2015, connectors: 'USB-C', contacts: '24 at receptacle', power: 'Up to 100 W', notes: 'Programmable Power Supply support, 5 A needs a rated e-marked cable' },
      { name: 'USB Power Delivery 3.1', version: 'PD 3.1', year: 2021, connectors: 'USB-C', contacts: '24 at receptacle', power: 'Up to 240 W, 48 V / 5 A', notes: 'Extended Power Range requires an EPR-rated e-marked cable' },
      { name: 'USB Power Delivery 3.2', version: 'PD 3.2', year: 2023, connectors: 'USB-C', contacts: '24 at receptacle', power: 'Up to 240 W', notes: 'Adds adjustable voltage supply for Standard Power Range' }
    ]
  },
  {
    family: 'HDMI',
    source: 'https://en.wikipedia.org/wiki/HDMI#Versions',
    defaults: {
      connectors: 'HDMI Type-A', contacts: '19', signal: 'TMDS differential',
      video: 'Format-dependent', audio: 'Up to 8 PCM channels / supported codecs',
      power: '5 V signaling, not device power', length: 'No universal maximum',
      impedance: '100 ohm differential', shielding: 'Shielded pairs and overall shield',
      compatibility: 'Earlier HDMI, shared device features'
    },
    rows: [
      { name: 'HDMI 1.0', version: '1.0', year: 2002, rate: '4.95 Gb/s', video: '1080p60, 8-bit RGB example', notes: '3 TMDS lanes, rate includes 8b/10b encoding overhead' },
      { name: 'HDMI 1.1', version: '1.1', year: 2004, rate: '4.95 Gb/s', notes: 'Adds DVD-Audio support' },
      { name: 'HDMI 1.2', version: '1.2', year: 2005, rate: '4.95 Gb/s', notes: 'Adds one-bit audio and broader PC support' },
      { name: 'HDMI 1.2a', version: '1.2a', year: 2005, rate: '4.95 Gb/s', notes: 'Consumer Electronics Control specification update' },
      { name: 'HDMI 1.3', version: '1.3', year: 2006, connectors: 'HDMI A / Mini C', rate: '10.2 Gb/s', video: 'Deep Color, format-dependent', notes: 'Higher clock, Dolby TrueHD and DTS-HD bitstreams' },
      { name: 'HDMI 1.3a', version: '1.3a', year: 2006, connectors: 'HDMI A / Mini C', rate: '10.2 Gb/s', notes: 'Connector and compliance clarifications, no bandwidth increase' },
      { name: 'HDMI 1.3b', version: '1.3b', year: 2007, connectors: 'HDMI A / Mini C', rate: '10.2 Gb/s', notes: 'Compliance testing revision, no bandwidth increase' },
      { name: 'HDMI 1.3b1', version: '1.3b1', year: 2007, connectors: 'HDMI A / Mini C', rate: '10.2 Gb/s', notes: 'Mini connector testing update' },
      { name: 'HDMI 1.3c', version: '1.3c', year: 2008, connectors: 'HDMI A / Mini C', rate: '10.2 Gb/s', notes: 'Compliance testing revision, no bandwidth increase' },
      { name: 'HDMI 1.4', version: '1.4', year: 2009, connectors: 'HDMI A / Mini C / Micro D / E', rate: '10.2 Gb/s', video: '4K30, 8-bit RGB example', audio: 'Audio Return Channel, supported codecs', notes: 'Adds ARC, HDMI Ethernet Channel, 3D and Micro HDMI' },
      { name: 'HDMI 1.4a', version: '1.4a', year: 2010, connectors: 'HDMI A / C / D / E', rate: '10.2 Gb/s', notes: 'Additional mandatory broadcast 3D formats' },
      { name: 'HDMI 1.4b', version: '1.4b', year: 2011, connectors: 'HDMI A / C / D / E', rate: '10.2 Gb/s', notes: 'Minor specification clarifications, no bandwidth increase' },
      { name: 'HDMI 2.0', version: '2.0', year: 2013, connectors: 'HDMI A / C / D / E', rate: '18 Gb/s', video: '4K60, 8-bit RGB example', audio: 'Up to 32 audio channels', notes: '600 MHz TMDS, features depend on endpoints' },
      { name: 'HDMI 2.0a', version: '2.0a', year: 2015, connectors: 'HDMI A / C / D / E', rate: '18 Gb/s', audio: 'Up to 32 audio channels', notes: 'Adds static HDR metadata' },
      { name: 'HDMI 2.0b', version: '2.0b', year: 2016, connectors: 'HDMI A / C / D / E', rate: '18 Gb/s', audio: 'Up to 32 audio channels', notes: 'Hybrid Log-Gamma HDR support' },
      { name: 'HDMI 2.1', version: '2.1', year: 2017, rate: '48 Gb/s', signal: 'FRL / TMDS', video: '4K120 / 8K60, format-dependent', audio: 'eARC, up to 32 audio channels', notes: 'FRL, optional DSC, VRR and ALLM, version alone does not guarantee features' },
      { name: 'HDMI 2.1a', version: '2.1a', year: 2022, rate: '48 Gb/s', signal: 'FRL / TMDS', audio: 'eARC, up to 32 audio channels', notes: 'Source-Based Tone Mapping, cable power amendment' },
      { name: 'HDMI 2.1b', version: '2.1b', year: 2023, rate: '48 Gb/s', signal: 'FRL / TMDS', audio: 'eARC, up to 32 audio channels', notes: 'Specification refinements, no bandwidth increase' },
      { name: 'HDMI 2.2', version: '2.2', year: 2025, rate: '96 Gb/s', signal: 'Next-generation FRL / TMDS', video: '4K240 / 8K60 full chroma examples', audio: 'eARC, supported codecs', notes: 'Ultra96 cable, Latency Indication Protocol, actual format depends on bit depth and compression' }
    ]
  },
  {
    family: 'HDMI cable classes',
    source: 'https://www.hdmi.org/resource/cables',
    defaults: {
      version: 'Cable certification', year: 'Not specified', connectors: 'HDMI Type-A', contacts: '19',
      signal: 'HDMI differential', audio: 'HDMI audio', power: 'Signaling / supported active cable power',
      length: 'Certified at supplied length', impedance: '100 ohm differential',
      shielding: 'Shielded pairs and overall shield', compatibility: 'Earlier HDMI'
    },
    rows: [
      { name: 'Standard HDMI', rate: '2.2275 Gb/s test rate', video: '720p / 1080i examples', notes: 'Category 1, cable class is not a device version' },
      { name: 'Standard HDMI with Ethernet', rate: '2.2275 Gb/s test rate', video: '720p / 1080i examples', notes: 'Adds HDMI Ethernet Channel wiring' },
      { name: 'Standard Automotive HDMI', connectors: 'HDMI Type-E', rate: '2.2275 Gb/s test rate', video: '720p / 1080i examples', notes: 'Automotive connector and environmental requirements' },
      { name: 'High Speed HDMI', rate: '10.2 Gb/s', video: '1080p / 4K30 examples', notes: 'Category 2' },
      { name: 'High Speed HDMI with Ethernet', rate: '10.2 Gb/s', video: '1080p / 4K30 examples', notes: 'Category 2 with HDMI Ethernet Channel wiring' },
      { name: 'Premium High Speed HDMI', rate: '18 Gb/s', video: '4K60, 8-bit RGB example', notes: 'Certification for full 18 Gb/s performance, with or without Ethernet' },
      { name: 'Ultra High Speed HDMI', year: 2017, rate: '48 Gb/s', video: '4K120 / 8K60, format-dependent', notes: 'Certification includes EMI testing, supports eARC' },
      { name: 'Ultra96 HDMI', year: 2025, rate: '96 Gb/s', video: '4K240 / 8K60 full chroma examples', notes: 'New certification for HDMI 2.2 maximum bandwidth' }
    ]
  },
  {
    family: 'DisplayPort',
    source: 'https://en.wikipedia.org/wiki/DisplayPort#Versions',
    defaults: {
      connectors: 'DisplayPort / Mini DP', contacts: '20', signal: '4 differential lanes',
      video: 'Format-dependent', audio: 'Embedded digital audio', power: 'No device power through standard DP cable',
      length: 'Cable and link-rate dependent', impedance: '100 ohm differential',
      shielding: 'Shielded pairs and overall shield', compatibility: 'Earlier DP, adapters depend on DP++'
    },
    rows: [
      { name: 'DisplayPort 1.0', version: '1.0', year: 2006, rate: '10.8 Gb/s', notes: 'HBR, 8.64 Gb/s payload after 8b/10b encoding' },
      { name: 'DisplayPort 1.1', version: '1.1', year: 2007, rate: '10.8 Gb/s', notes: 'Adds HDCP and alternative link-layer support' },
      { name: 'DisplayPort 1.1a', version: '1.1a', year: 2008, rate: '10.8 Gb/s', notes: 'Specification clarifications' },
      { name: 'DisplayPort 1.2', version: '1.2', year: 2010, rate: '21.6 Gb/s', video: '4K60 example, MST', notes: 'HBR2, 17.28 Gb/s payload, Multi-Stream Transport' },
      { name: 'DisplayPort 1.2a', version: '1.2a', year: 2013, rate: '21.6 Gb/s', notes: 'Optional Adaptive-Sync, no bandwidth increase' },
      { name: 'DisplayPort 1.3', version: '1.3', year: 2014, rate: '32.4 Gb/s', video: '4K120, 8-bit RGB example', notes: 'HBR3, 25.92 Gb/s payload' },
      { name: 'DisplayPort 1.4', version: '1.4', year: 2016, rate: '32.4 Gb/s', video: '8K60 with DSC, format-dependent', notes: 'DSC 1.2, HDR metadata and forward error correction' },
      { name: 'DisplayPort 1.4a', version: '1.4a', year: 2018, rate: '32.4 Gb/s', notes: 'Updates to DSC 1.2a, no bandwidth increase' },
      { name: 'DisplayPort 2.0', version: '2.0', year: 2019, rate: '80 Gb/s', video: '8K60 HDR uncompressed example', notes: 'UHBR10 / 13.5 / 20, approximately 77.37 Gb/s payload at UHBR20' },
      { name: 'DisplayPort 2.1', version: '2.1', year: 2022, rate: '80 Gb/s', notes: 'USB4 alignment and DP40 / DP80 cable certification' },
      { name: 'DisplayPort 2.1a', version: '2.1a', year: 2024, rate: '80 Gb/s', notes: 'DP54 replaces DP40 certification for UHBR13.5 cables' },
      { name: 'DisplayPort 2.1b', version: '2.1b', year: 2025, rate: '80 Gb/s', notes: 'DP80LL active cables extend UHBR20 reach to 3 m' },
      { name: 'DisplayPort over USB-C', version: 'DP Alt Mode', year: 2014, connectors: 'USB-C', contacts: '24 at receptacle', rate: 'DP revision and lane allocation dependent', power: 'USB-C / PD negotiated', notes: 'Two or four DP lanes, not supported by every USB-C port or cable' }
    ]
  },
  {
    family: 'DisplayPort cable classes',
    source: 'https://en.wikipedia.org/wiki/DisplayPort#Cables_and_connectors',
    defaults: {
      version: 'Cable certification', year: 'Not specified', connectors: 'DisplayPort / Mini DP',
      contacts: '20', signal: '4 differential lanes', video: 'Format-dependent',
      audio: 'Embedded digital audio', power: 'Do not connect DP_PWR end-to-end',
      length: 'Certified at supplied length', impedance: '100 ohm differential',
      shielding: 'Shielded pairs and overall shield', compatibility: 'Earlier DisplayPort'
    },
    rows: [
      { name: 'DisplayPort DP8K', rate: '32.4 Gb/s', notes: 'HBR3 cable certification, display format may need DSC' },
      { name: 'DisplayPort DP40', year: 2022, rate: '40 Gb/s', notes: 'UHBR10 cable certification, superseded by DP54' },
      { name: 'DisplayPort DP54', year: 2024, rate: '54 Gb/s', notes: 'UHBR13.5 cable certification' },
      { name: 'DisplayPort DP80', year: 2022, rate: '80 Gb/s', notes: 'UHBR20 cable certification' },
      { name: 'DisplayPort DP80LL', year: 2025, rate: '80 Gb/s', length: 'Up to 3 m, active', notes: 'Low-loss active UHBR20 cable certification' }
    ]
  },
  {
    family: 'Thunderbolt',
    source: 'https://en.wikipedia.org/wiki/Thunderbolt_(interface)',
    defaults: {
      signal: 'Differential serial, tunneled PCIe / DP', audio: 'DisplayPort / audio devices',
      length: 'Cable type and rating dependent', impedance: 'Cable specification dependent',
      shielding: 'Shielded copper or optical', compatibility: 'Adapters and endpoint support required'
    },
    rows: [
      { name: 'Thunderbolt 1', version: '1', year: 2011, connectors: 'Mini DisplayPort', contacts: '20', rate: '2 x 10 Gb/s channels', video: 'DisplayPort 1.1a', power: 'Up to 10 W bus power', notes: 'Two separate 10 Gb/s channels, not one 20 Gb/s channel' },
      { name: 'Thunderbolt 2', version: '2', year: 2013, connectors: 'Mini DisplayPort', contacts: '20', rate: '20 Gb/s', video: 'DisplayPort 1.2', power: 'Up to 10 W bus power', notes: 'Bonds the two original channels' },
      { name: 'Thunderbolt 3', version: '3', year: 2015, connectors: 'USB-C', contacts: '24 at receptacle', rate: '40 Gb/s', video: 'DP 1.2 / 1.4, controller-dependent', power: '15 W bus power, PD up to 100 W', notes: 'Some passive cables fall to 20 Gb/s at longer lengths' },
      { name: 'Thunderbolt 4', version: '4', year: 2020, connectors: 'USB-C', contacts: '24 at receptacle', rate: '40 Gb/s', video: 'Two 4K displays minimum PC requirement', power: '15 W bus power, PD charging', notes: 'Higher minimum requirements than TB3, USB4 compatibility' },
      { name: 'Thunderbolt 5', version: '5', year: 2023, connectors: 'USB-C', contacts: '24 at receptacle', rate: '80 Gb/s, boost 120 / 40 Gb/s', video: 'DisplayPort 2.1 tunneling', power: 'PD up to 240 W where supported', notes: 'Bandwidth Boost reallocates lanes, 120 Gb/s is not symmetric' }
    ]
  },
  {
    family: 'Ethernet cable categories',
    source: 'https://en.wikipedia.org/wiki/Twisted_pair#Cable_shielding',
    defaults: {
      version: 'Cabling category', year: 'Not specified', connectors: '8P8C (often called RJ45)',
      contacts: '8', signal: 'Balanced twisted pairs', video: 'Network traffic', audio: 'Network audio protocols',
      power: 'PoE if endpoints and cable support it', impedance: '100 ohm differential',
      compatibility: 'Link standard, category and termination dependent'
    },
    rows: [
      { name: 'Category 3', rate: '10 Mb/s, 16 MHz cabling', length: '100 m channel', shielding: 'Usually U/UTP', notes: '10BASE-T, legacy 100BASE-T4 also used Cat 3' },
      { name: 'Category 5', rate: '100 Mb/s typical, 100 MHz cabling', length: '100 m channel', shielding: 'UTP / shielded variants', notes: 'Obsolete category, some installations qualify for 1000BASE-T' },
      { name: 'Category 5e', rate: '1 Gb/s, 100 MHz cabling', length: '100 m channel', shielding: 'UTP / shielded variants', notes: '2.5GBASE-T also targets Cat 5e, installation qualification matters' },
      { name: 'Category 6', rate: '10 Gb/s, 250 MHz cabling', length: '10G: up to 55 m, 1G: 100 m', shielding: 'UTP / shielded variants', notes: '10G reach depends on alien crosstalk and installation' },
      { name: 'Category 6A', rate: '10 Gb/s, 500 MHz cabling', length: '100 m channel', shielding: 'UTP / shielded variants', notes: 'Full-length 10GBASE-T channel' },
      { name: 'Category 7', connectors: 'GG45 / TERA', rate: '10 Gb/s, 600 MHz cabling', length: '100 m channel', shielding: 'Individually shielded pairs', notes: 'ISO category, not a TIA category, ordinary RJ45 assemblies do not establish Class F compliance' },
      { name: 'Category 7A', connectors: 'GG45 / TERA', rate: '10 Gb/s, 1000 MHz cabling', length: '100 m channel', shielding: 'Individually shielded pairs', notes: 'ISO Class FA cabling, MHz is not a network data rate' },
      { name: 'Category 8.1', connectors: '8P8C', rate: '25 / 40 Gb/s, 2000 MHz cabling', length: '30 m channel', shielding: 'Shielded', notes: 'ISO Class I, Cat 8 in TIA uses RJ45-compatible connectors' },
      { name: 'Category 8.2', connectors: 'GG45 / TERA', rate: '25 / 40 Gb/s, 2000 MHz cabling', length: '30 m channel', shielding: 'Shielded', notes: 'ISO Class II, different connector requirements from Cat 8.1' }
    ]
  },
  {
    family: 'Ethernet link standards',
    source: 'https://en.wikipedia.org/wiki/Ethernet_over_twisted_pair',
    defaults: {
      connectors: '8P8C', contacts: '8', signal: 'Balanced twisted pairs', video: 'Network traffic',
      audio: 'Network audio protocols', power: 'PoE if supported', impedance: '100 ohm differential',
      shielding: 'Category-dependent', compatibility: 'Autonegotiation if supported'
    },
    rows: [
      { name: '10BASE-T', version: 'IEEE 802.3i', year: 1990, rate: '10 Mb/s', length: '100 m', notes: 'Two pairs, Cat 3 or better' },
      { name: '100BASE-TX', version: 'IEEE 802.3u', year: 1995, rate: '100 Mb/s', length: '100 m', notes: 'Two pairs, Cat 5 or better' },
      { name: '1000BASE-T', version: 'IEEE 802.3ab', year: 1999, rate: '1 Gb/s', length: '100 m', notes: 'Four pairs, Cat 5e commonly used' },
      { name: '2.5GBASE-T', version: 'IEEE 802.3bz', year: 2016, rate: '2.5 Gb/s', length: '100 m', notes: 'Cat 5e or better, channel qualification applies' },
      { name: '5GBASE-T', version: 'IEEE 802.3bz', year: 2016, rate: '5 Gb/s', length: '100 m on Cat 6', notes: 'Cat 5e can work on qualified channels' },
      { name: '10GBASE-T', version: 'IEEE 802.3an', year: 2006, rate: '10 Gb/s', length: '100 m on Cat 6A', notes: 'Cat 6 supports shorter qualified channels' },
      { name: '25GBASE-T', version: 'IEEE 802.3bq', year: 2016, rate: '25 Gb/s', length: '30 m on Cat 8', notes: 'Data-center copper channel' },
      { name: '40GBASE-T', version: 'IEEE 802.3bq', year: 2016, rate: '40 Gb/s', length: '30 m on Cat 8', notes: 'Data-center copper channel' }
    ]
  },
  {
    family: 'Analog audio',
    source: 'https://en.wikipedia.org/wiki/Audio_and_video_connector#Audio_connectors',
    defaults: {
      version: 'Wiring format', year: 'Not specified', rate: 'Not applicable to analog audio',
      video: 'No', power: 'No standard device power', length: 'Equipment and cable dependent',
      impedance: 'Not a fixed cable requirement', shielding: 'Shielded',
      compatibility: 'Check level, wiring and connector'
    },
    rows: [
      { name: '6.35 mm TS', connectors: '1/4-inch TS jack', contacts: '2', signal: 'Unbalanced analog', audio: 'Mono', notes: 'Instrument / line cable, not interchangeable with speaker cable' },
      { name: '6.35 mm TRS balanced', connectors: '1/4-inch TRS jack', contacts: '3', signal: 'Balanced analog', audio: 'Mono', notes: 'Tip hot, ring cold, sleeve shield' },
      { name: '6.35 mm TRS stereo', connectors: '1/4-inch TRS jack', contacts: '3', signal: 'Unbalanced analog', audio: 'Stereo', notes: 'Tip left, ring right, sleeve common' },
      { name: '3.5 mm TS', connectors: '3.5 mm TS jack', contacts: '2', signal: 'Unbalanced analog', audio: 'Mono', notes: 'Common in modular synth patching' },
      { name: '3.5 mm TRS stereo', connectors: '3.5 mm TRS jack', contacts: '3', signal: 'Unbalanced analog', audio: 'Stereo', notes: 'Headphones and auxiliary line connections' },
      { name: '3.5 mm TRRS CTIA', version: 'CTIA / AHJ', connectors: '3.5 mm TRRS jack', contacts: '4', signal: 'Unbalanced analog', audio: 'Stereo + microphone', power: 'Microphone bias if supported', notes: 'Tip L, ring 1 R, ring 2 ground, sleeve microphone' },
      { name: '3.5 mm TRRS OMTP', version: 'OMTP', connectors: '3.5 mm TRRS jack', contacts: '4', signal: 'Unbalanced analog', audio: 'Stereo + microphone', power: 'Microphone bias if supported', notes: 'Microphone and ground exchanged relative to CTIA' },
      { name: '2.5 mm TRS', connectors: '2.5 mm TRS jack', contacts: '3', signal: 'Device-dependent analog', audio: 'Device-dependent', notes: 'Headset and balanced-headphone wiring are not universal' },
      { name: '4.4 mm balanced headphones', version: 'Pentaconn', connectors: '4.4 mm TRRRS jack', contacts: '5', signal: 'Balanced analog', audio: 'Stereo', notes: 'Separate positive and negative connections for each channel' },
      { name: 'RCA audio', connectors: 'RCA / phono', contacts: '2 per plug', signal: 'Unbalanced analog', audio: 'Mono per cable', notes: 'Stereo uses two cables, phono-level sources may need a preamp' },
      { name: 'XLR microphone / line', connectors: '3-pin XLR', contacts: '3', signal: 'Balanced analog', audio: 'Mono', power: 'Phantom power if provided', notes: 'Pin 1 shield, pin 2 hot, pin 3 cold' },
      { name: 'XLR stereo microphone', connectors: '5-pin XLR', contacts: '5', signal: 'Balanced analog', audio: 'Stereo', power: 'Microphone-dependent', notes: 'Check the microphone pinout before connecting' },
      { name: 'XLR balanced headphones', connectors: '4-pin XLR', contacts: '4', signal: 'Balanced analog', audio: 'Stereo', notes: 'Headphone connection, not a microphone connector' },
      { name: 'TRS insert cable', version: 'Insert Y cable', connectors: 'TRS to 2 x TS', contacts: '3 to 2 + 2', signal: 'Unbalanced send / return', audio: 'Mono insert loop', notes: 'Common wiring: tip send, ring return, verify equipment' },
      { name: 'DB25 analog audio', version: 'Tascam / AES59 pinout', connectors: 'DB25 to XLR / TRS', contacts: '25', signal: '8 balanced analog channels', audio: '8 channels', notes: 'Other DB25 pinouts exist, connector alone does not identify wiring' }
    ]
  },
  {
    family: 'Speaker cables',
    source: 'https://en.wikipedia.org/wiki/Speaker_wire',
    defaults: {
      version: 'Connector format', year: 'Not specified', signal: 'Amplified analog',
      rate: 'Not applicable to analog audio', video: 'No', audio: 'Speaker-level audio',
      power: 'Amplifier-dependent', length: 'Gauge, load and amplifier dependent',
      impedance: 'Low cable resistance required', shielding: 'Usually unshielded',
      compatibility: 'Match amplifier and speaker wiring'
    },
    rows: [
      { name: 'Speaker wire', connectors: 'Bare wire / binding posts', contacts: '2', notes: 'Observe polarity, select gauge for length and load' },
      { name: 'Banana speaker cable', connectors: '4 mm banana plugs', contacts: '2 per channel', notes: 'Not a mains-power connector' },
      { name: 'speakON 2-pole', connectors: 'NL2 / compatible NL4 socket', contacts: '2', notes: 'Locking speaker connector, check socket compatibility' },
      { name: 'speakON 4-pole', connectors: 'NL4', contacts: '4', notes: 'Can carry two circuits, bi-amp and bridge wiring vary' },
      { name: 'speakON 8-pole', connectors: 'NL8', contacts: '8', notes: 'Can carry four circuits, wiring depends on the system' },
      { name: '6.35 mm speaker cable', connectors: '1/4-inch TS jack', contacts: '2', notes: 'Same plug shape as an instrument cable, use speaker-rated wire' }
    ]
  },
  {
    family: 'Digital audio and control',
    source: 'https://en.wikipedia.org/wiki/Audio_and_video_connector#Digital_audio',
    defaults: {
      year: 'Not specified', video: 'No', power: 'No', length: 'Equipment-dependent',
      compatibility: 'Match protocol and wiring'
    },
    rows: [
      { name: 'S/PDIF coaxial', version: 'IEC 60958 consumer', connectors: 'RCA', contacts: '2', signal: 'Coaxial digital', rate: 'Sample-rate dependent', audio: '2 PCM channels / compressed surround', impedance: '75 ohm', shielding: 'Coaxial shield', notes: 'Use a 75-ohm digital cable, not arbitrary analog RCA wiring' },
      { name: 'S/PDIF optical', version: 'TOSLINK', connectors: 'TOSLINK / Mini-TOSLINK', contacts: 'Optical', signal: 'Optical digital', rate: 'Sample-rate and equipment dependent', audio: '2 PCM channels / compressed surround', impedance: 'Not applicable', shielding: 'Not needed for optical signal', length: 'Often 5-10 m, equipment-dependent', notes: 'Mini-TOSLINK resembles a 3.5 mm jack but carries light' },
      { name: 'AES3 balanced', version: 'AES3', connectors: '3-pin XLR', contacts: '3', signal: 'Balanced digital', rate: 'Sample-rate dependent', audio: '2 PCM channels', impedance: '110 ohm differential', shielding: 'Shielded twisted pair', notes: 'Microphone XLR cables may not meet the digital impedance requirement' },
      { name: 'AES3id coaxial', version: 'AES3id', connectors: 'BNC', contacts: '2', signal: 'Coaxial digital', rate: 'Sample-rate dependent', audio: '2 PCM channels', impedance: '75 ohm', shielding: 'Coaxial shield', notes: 'Professional digital audio over coax' },
      { name: 'ADAT Lightpipe', version: 'ADAT optical', year: 1991, connectors: 'TOSLINK', contacts: 'Optical', signal: 'Optical digital', rate: 'Sample-rate dependent', audio: '8 at 48 kHz, 4 at 96 kHz, 2 at 192 kHz', impedance: 'Not applicable', shielding: 'Not needed for optical signal', notes: 'Higher rates require S/MUX support, not compatible with optical S/PDIF' },
      { name: 'MADI coaxial', version: 'AES10', year: 1991, connectors: 'BNC', contacts: '2', signal: 'Coaxial digital', rate: '125 Mb/s line rate', audio: '56 / 64 channels at base rate', impedance: '75 ohm', shielding: 'Coaxial shield', length: 'Up to 100 m', notes: 'Channel count falls at higher sample rates' },
      { name: 'MADI optical', version: 'AES10', year: 1991, connectors: 'SC / equipment-specific optical', contacts: 'Optical', signal: 'Optical digital', rate: '125 Mb/s line rate', audio: '56 / 64 channels at base rate', impedance: 'Not applicable', shielding: 'Not needed for optical signal', length: 'Up to 2 km typical specification', notes: 'Check fiber type and transceiver requirements' },
      { name: 'Word clock', version: 'Clock signal', connectors: 'BNC', contacts: '2', signal: 'Coaxial clock', rate: 'Usually sample rate', audio: 'Clock only, no audio samples', impedance: '75 ohm', shielding: 'Coaxial shield', notes: 'Terminate according to equipment instructions' },
      { name: 'MIDI DIN', version: 'MIDI 1.0', year: 1983, connectors: '5-pin DIN', contacts: '5, 3 normally wired', signal: 'Current-loop serial', rate: '31.25 kb/s', audio: 'Control only, no audio samples', impedance: 'Not a fixed cable requirement', shielding: 'Shielded', length: 'Up to 15 m recommended', notes: 'MIDI In / Out direction matters' },
      { name: 'MIDI TRS Type A', version: 'MIDI TRS A', year: 2018, connectors: '2.5 / 3.5 mm TRS to DIN', contacts: '3 to 5', signal: 'Current-loop serial', rate: '31.25 kb/s', audio: 'Control only, no audio samples', impedance: 'Not a fixed cable requirement', shielding: 'Shielded', notes: 'Tip DIN 5, ring DIN 4, sleeve DIN 2' },
      { name: 'MIDI TRS Type B', version: 'MIDI TRS B', connectors: '2.5 / 3.5 mm TRS to DIN', contacts: '3 to 5', signal: 'Current-loop serial', rate: '31.25 kb/s', audio: 'Control only, no audio samples', impedance: 'Not a fixed cable requirement', shielding: 'Shielded', notes: 'Tip DIN 4, ring DIN 5, sleeve DIN 2, not interchangeable with Type A' },
      { name: 'DMX512', version: 'DMX512-A', year: 2004, connectors: '5-pin XLR', contacts: '5', signal: 'RS-485 differential', rate: '250 kb/s', audio: 'Lighting control only', impedance: '120 ohm differential', shielding: 'Shielded twisted pair', length: 'Up to 300 m typical segment', notes: '3-pin implementations exist but are not the standard connector, terminate the bus' }
    ]
  },
  {
    family: 'Legacy video',
    source: 'https://en.wikipedia.org/wiki/Audio_and_video_connector#Video_connectors',
    defaults: {
      version: 'Connector / signal format', year: 'Not specified', power: 'No device power',
      length: 'Equipment and cable dependent', shielding: 'Shielded',
      compatibility: 'Matching signal required, conversion may be active'
    },
    rows: [
      { name: 'VGA', connectors: 'DE-15', contacts: '15', signal: 'Analog RGB + sync', rate: 'Pixel-clock dependent', video: 'Resolution and clock dependent', audio: 'No', impedance: '75 ohm video lines', notes: 'No single maximum resolution for the connector' },
      { name: 'DVI-D single-link', version: 'DVI 1.0', year: 1999, connectors: 'DVI-D', contacts: '18 + 1', signal: 'TMDS digital', rate: '4.95 Gb/s', video: '1920 x 1200 at 60 Hz example', audio: 'No standard DVI audio', impedance: '100 ohm differential', notes: '165 MHz maximum pixel clock, HDMI adapters can carry shared TMDS formats' },
      { name: 'DVI-D dual-link', version: 'DVI 1.0', year: 1999, connectors: 'DVI-D', contacts: '24 + 1', signal: 'TMDS digital', rate: '9.9 Gb/s', video: '2560 x 1600 at 60 Hz example', audio: 'No standard DVI audio', impedance: '100 ohm differential', notes: 'Two TMDS links, passive HDMI adapters do not supply dual-link DVI' },
      { name: 'DVI-I single-link', version: 'DVI 1.0', year: 1999, connectors: 'DVI-I', contacts: '18 + 5', signal: 'TMDS digital / analog RGB', rate: '4.95 Gb/s digital', video: 'Digital or analog', audio: 'No standard DVI audio', impedance: '100 ohm digital / 75 ohm analog', notes: 'Analog pins allow a passive VGA adapter where the source supports analog output' },
      { name: 'DVI-I dual-link', version: 'DVI 1.0', year: 1999, connectors: 'DVI-I', contacts: '24 + 5', signal: 'TMDS digital / analog RGB', rate: '9.9 Gb/s digital', video: 'Digital or analog', audio: 'No standard DVI audio', impedance: '100 ohm digital / 75 ohm analog', notes: 'Check whether the source actually provides both links and analog output' },
      { name: 'DVI-A', version: 'DVI 1.0', year: 1999, connectors: 'DVI-A', contacts: '12 + 5', signal: 'Analog RGB', rate: 'Pixel-clock dependent', video: 'Analog only', audio: 'No', impedance: '75 ohm video lines', notes: 'Not compatible with digital-only DVI-D ports' },
      { name: 'Composite video', connectors: 'RCA / BNC', contacts: '2', signal: 'Analog composite', rate: 'Not applicable to analog video', video: 'SD PAL / NTSC', audio: 'Separate cable', impedance: '75 ohm', notes: 'One cable combines luminance and chrominance' },
      { name: 'S-Video', connectors: '4-pin Mini-DIN', contacts: '4', signal: 'Analog Y/C', rate: 'Not applicable to analog video', video: 'SD PAL / NTSC', audio: 'Separate cable', impedance: '75 ohm per signal', notes: 'Separate luminance and chrominance' },
      { name: 'Component video', connectors: '3 x RCA / BNC', contacts: '2 per plug', signal: 'Analog YPbPr', rate: 'Not applicable to analog video', video: 'SD / HD, equipment-dependent', audio: 'Separate cables', impedance: '75 ohm per signal', notes: 'Three video cables, not composite video or stereo audio' },
      { name: 'SCART', connectors: 'SCART', contacts: '21 including shell', signal: 'Analog RGB / composite / optional Y/C', rate: 'Not applicable to analog video', video: 'SD', audio: 'Stereo analog', impedance: '75 ohm video lines', notes: 'Wiring and supported signal modes vary' }
    ]
  },
  {
    family: 'SDI',
    source: 'https://en.wikipedia.org/wiki/Serial_digital_interface',
    defaults: {
      connectors: 'BNC', contacts: '2', signal: 'Coaxial serial digital',
      audio: 'Embedded digital audio', power: 'No', length: 'Cable and equipment dependent',
      impedance: '75 ohm', shielding: 'Coaxial shield', compatibility: 'Endpoint rate support required'
    },
    rows: [
      { name: 'SD-SDI', version: 'SMPTE 259M', year: 1997, rate: '270 Mb/s common mode', video: 'SD', notes: 'Other rates are defined for other SD formats' },
      { name: 'HD-SDI', version: 'SMPTE 292M', year: 1998, rate: '1.485 Gb/s', video: '720p / 1080i examples', notes: 'Also 1.485/1.001 Gb/s for fractional frame rates' },
      { name: 'Dual-link HD-SDI', version: 'SMPTE 372M', year: 2002, connectors: '2 x BNC', contacts: '2 per plug', rate: '2 x 1.485 Gb/s', video: '1080p60 example', notes: 'Requires two synchronized physical links' },
      { name: '3G-SDI', version: 'SMPTE 424M', year: 2006, rate: '2.97 Gb/s', video: '1080p60 example', notes: 'Level A and Level B mapping compatibility matters' },
      { name: '6G-SDI', version: 'SMPTE ST 2081', year: 2015, rate: '5.94 Gb/s', video: '2160p30 example', notes: 'Use coax and connectors rated for the required rate' },
      { name: '12G-SDI', version: 'SMPTE ST 2082', year: 2015, rate: '11.88 Gb/s', video: '2160p60 example', notes: 'Actual format depends on bit depth, sampling and mapping' }
    ]
  },
  {
    family: 'Storage and legacy data',
    source: 'https://en.wikipedia.org/wiki/List_of_interface_bit_rates',
    defaults: {
      year: 'Not specified', video: 'No native video', audio: 'Data only',
      length: 'Standard and equipment dependent', impedance: 'Standard-dependent',
      shielding: 'Cable-dependent', compatibility: 'Matching interfaces required'
    },
    rows: [
      { name: 'SATA I', version: 'SATA 1.0', year: 2003, connectors: 'SATA data', contacts: '7', signal: 'Differential serial', rate: '1.5 Gb/s', power: 'Separate 15-pin power cable', length: '1 m', notes: '150 MB/s before protocol overhead, 8b/10b encoding' },
      { name: 'SATA II', version: 'SATA 2.0', year: 2004, connectors: 'SATA data', contacts: '7', signal: 'Differential serial', rate: '3 Gb/s', power: 'Separate 15-pin power cable', length: '1 m', notes: '300 MB/s before protocol overhead' },
      { name: 'SATA III', version: 'SATA 3.0', year: 2009, connectors: 'SATA data', contacts: '7', signal: 'Differential serial', rate: '6 Gb/s', power: 'Separate 15-pin power cable', length: '1 m', notes: '600 MB/s before protocol overhead, later 3.x revisions retain 6 Gb/s' },
      { name: 'eSATA', version: 'External SATA', year: 2004, connectors: 'eSATA', contacts: '7', signal: 'Differential serial', rate: 'Up to 6 Gb/s', power: 'No, eSATAp is a separate variant', length: '2 m', notes: 'External connector differs from internal SATA' },
      { name: 'FireWire 400', version: 'IEEE 1394 / 1394a', year: 1995, connectors: '4-pin / 6-pin', contacts: '4 / 6', signal: 'Differential serial', rate: '393.216 Mb/s', power: '6-pin bus power, 4-pin none', length: '4.5 m per hop', notes: 'S100 / S200 / S400 modes, 1394a update published in 2000' },
      { name: 'FireWire 800', version: 'IEEE 1394b', year: 2002, connectors: '9-pin', contacts: '9', signal: 'Differential serial', rate: '786.432 Mb/s', power: 'Bus power if provided', length: '4.5 m copper typical', notes: 'Bilingual adapters can connect 400 equipment at its lower rate' },
      { name: 'FireWire S1600', version: 'IEEE 1394b / 1394-2008', year: 2008, connectors: '9-pin / specified media', contacts: 'Media-dependent', signal: 'Serial digital', rate: '1.572864 Gb/s', power: 'Media-dependent', notes: 'Rarely implemented higher-speed mode' },
      { name: 'FireWire S3200', version: 'IEEE 1394b / 1394-2008', year: 2008, connectors: '9-pin / specified media', contacts: 'Media-dependent', signal: 'Serial digital', rate: '3.145728 Gb/s', power: 'Media-dependent', notes: 'Rarely implemented higher-speed mode' },
      { name: 'RS-232 serial', version: 'RS-232', connectors: 'DE-9 / DB25', contacts: '9 / 25', signal: 'Single-ended serial', rate: 'Baud rate and equipment dependent', power: 'No standard device power', notes: 'Straight-through and null-modem cables have different wiring' },
      { name: 'PS/2', version: 'PS/2', year: 1987, connectors: '6-pin Mini-DIN', contacts: '6', signal: 'Clocked serial', rate: '10-16.7 kHz clock typical', power: '5 V', notes: 'Keyboard / mouse, passive USB adapters need dual-protocol devices' }
    ]
  }
];

const cableReferenceKeys = [
  'name', 'family', 'version', 'year', 'connectors', 'contacts', 'signal',
  'rate', 'video', 'audio', 'power', 'length', 'impedance', 'shielding',
  'compatibility', 'notes', 'source'
];

function getCableConnectorIcons(record) {
  const connectors = record.connectors;
  const icons = [];
  const add = (id, label) => icons.push({ id, label });
  if (record.family.startsWith('USB')) {
    if (/(?:^|[ /])(?:Type-)?A(?:\s*\/|$)/.test(connectors)) add('connector', 'USB Type-A');
    if (/(?:^|[ /])(?:Type-)?B(?:\s*\/|$)/.test(connectors)) add('connector_usb_b', 'USB Type-B');
    if (/Mini/.test(connectors)) add('connector_usb_mini', 'USB Mini');
    if (/Micro/.test(connectors)) add('connector_usb_micro', 'USB Micro');
    if (/USB-C|(?:^|\/ )C$/.test(connectors)) add('connector_usb_c', 'USB Type-C');
  } else {
    if (/USB-C/.test(connectors)) add('connector_usb_c', 'USB Type-C');
    if (/HDMI/.test(connectors)) add('connector_hdmi', 'HDMI');
    if (/DisplayPort|Mini DP/.test(connectors)) add('connector_displayport', 'DisplayPort');
    if (/8P8C/.test(connectors)) add('connector_rj45', '8P8C Ethernet');
    if (/GG45/.test(connectors)) add('connector_gg45', 'GG45');
    if (/TERA/.test(connectors)) add('connector_tera', 'TERA');
    if (/TRRRS/.test(connectors)) add('connector_jack_trrrs', 'TRRRS jack');
    else if (/TRRS/.test(connectors)) add('connector_jack_trrs', 'TRRS jack');
    else if (/TRS/.test(connectors)) add('connector_jack_trs', 'TRS jack');
    if (/\bTS\b/.test(connectors)) add('connector_jack_ts', 'TS jack');
    if (/RCA|phono/.test(connectors)) add('connector_rca', 'RCA');
    if (/XLR/.test(connectors)) {
      const pins = record.contacts === '4' ? 4 : record.contacts === '5' ? 5 : 3;
      add(pins === 3 ? 'connector_xlr' : `connector_xlr_${pins}`, `${pins}-pin XLR`);
    }
    if (/5-pin DIN|(?:^| )DIN$/.test(connectors)) add('midi', '5-pin DIN');
    else if (/Mini-DIN/.test(connectors)) add(record.contacts === '4' ? 'connector_din_4' : 'connector_din', `${record.contacts}-pin Mini-DIN`);
    if (/TOSLINK/.test(connectors)) add('connector_toslink', 'TOSLINK');
    if (/BNC/.test(connectors)) add('connector_bnc', 'BNC');
    if (/DB25/.test(connectors)) add('connector_db25', 'DB25');
    if (/DE-9/.test(connectors)) add('connector_de9', 'DE-9');
    if (/DE-15/.test(connectors)) add('connector_vga', 'VGA DE-15');
    if (/DVI/.test(connectors)) add('connector_dvi', 'DVI');
    if (/SCART/.test(connectors)) add('connector_scart', 'SCART');
    if (/SATA|eSATA/.test(connectors)) add('connector_sata', 'SATA');
    if (record.name.startsWith('FireWire')) add('connector_firewire', 'FireWire');
    if (/SC \/|optical/.test(connectors)) add('connector_fiber', 'Optical fiber');
    if (/banana/.test(connectors)) add('connector_banana', 'Banana');
    if (/binding posts/.test(connectors)) add('connector_binding', 'Binding post');
    if (/NL[248]/.test(connectors)) add('connector_speaker', 'speakON');
  }
  if (!icons.length) throw new Error(`Missing connector icon: ${record.name} / ${connectors}`);
  return icons;
}

const cableReferenceRows = cableReferenceGroups.flatMap((group) => group.rows.map((row) => {
  const record = { ...group.defaults, ...row, family: group.family, source: group.source };
  const cells = cableReferenceKeys.map((key) => {
    if (record[key] === undefined || record[key] === '') {
      throw new Error(`Missing cable reference value: ${row.name} / ${key}`);
    }
    const text = String(record[key]);
    const sourceLabel = key === 'source' ? text.split('/')[2].replace(/^www\./, '') : '';
    return key === 'source'
      ? { text, html: `<a href="${text}" target="wiki" rel="noopener">${sourceLabel}</a>` }
      : { text };
  });
  const icons = getCableConnectorIcons(record);
  cells.unshift({
    text: icons.map((icon) => icon.label).join(' / '),
    html: `<span class="reference-connector-icons">${icons.map((icon) => `<svg class="icons" role="img" aria-label="${icon.label}"><use href="/icons.svg#${icon.id}" /></svg>`).join('')}</span>`,
    className: 'center'
  });
  return cells;
}));
