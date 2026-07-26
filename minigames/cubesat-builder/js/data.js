// ISRO CubeSat Builder Data Definitions

const ISRO_COMPONENTS = {
    chassis: {
        id: 'chassis',
        name: 'CubeSat Frame',
        short: 'FRAME',
        category: 'base',
        icon: '🧊',
        color: '#94A3B8',
        desc: 'Standardized 3U/6U aluminum-titanium alloy structure'
    },
    solar: {
        id: 'solar',
        name: 'Solar Array Wings',
        short: 'SOLAR',
        category: 'power',
        icon: '🛰️',
        color: '#3B82F6',
        desc: 'Gallium arsenide high-efficiency solar panels'
    },
    battery: {
        id: 'battery',
        name: 'Li-Ion Battery Bank',
        short: 'BATTERY',
        category: 'power',
        icon: '🔋',
        color: '#10B981',
        desc: 'Space-qualified secondary energy storage cell'
    },
    obc: {
        id: 'obc',
        name: 'ISRO Avionics / OBC',
        short: 'OBC CPU',
        category: 'core',
        icon: '🧠',
        color: '#8B5CF6',
        desc: 'Rad-hardened micro-processor flight controller'
    },
    imager: {
        id: 'imager',
        name: 'Multispectral Imager',
        short: 'IMAGER',
        category: 'payload',
        icon: '📷',
        color: '#EC4899',
        desc: 'High-resolution Earth observation optical sensor'
    },
    sar: {
        id: 'sar',
        name: 'Synthetic Aperture Radar',
        short: 'SAR RADAR',
        category: 'payload',
        icon: '📡',
        color: '#F59E0B',
        desc: 'All-weather cloud-penetrating radar payload'
    },
    spectrometer: {
        id: 'spectrometer',
        name: 'IR Spectrometer',
        short: 'SPECTRO',
        category: 'payload',
        icon: '🔬',
        color: '#06B6D4',
        desc: 'Methane and mineral composition analyzer'
    },
    magnetometer: {
        id: 'magnetometer',
        name: 'Vector Magnetometer',
        short: 'MAG-SENSOR',
        category: 'payload',
        icon: '🧲',
        color: '#EF4444',
        desc: 'Solar flare particle field detector'
    },
    adcs: {
        id: 'adcs',
        name: 'Reaction Wheel ADCS',
        short: 'ADCS',
        category: 'nav',
        icon: '🔄',
        color: '#14B8A6',
        desc: 'Attitude determination & precision pointing gyros'
    },
    antenna: {
        id: 'antenna',
        name: 'High-Gain Dish Antenna',
        short: 'ANTENNA',
        category: 'comm',
        icon: '📶',
        color: '#F97316',
        desc: 'S-Band/X-Band deep space communications link'
    },
    thruster: {
        id: 'thruster',
        name: 'Cold Gas Thruster',
        short: 'THRUSTER',
        category: 'prop',
        icon: '🚀',
        color: '#6366F1',
        desc: 'Micro-propulsion orbit control thruster'
    }
};

const ISRO_BLUEPRINTS = [
    {
        id: 'eos07',
        name: 'EOS-07 Earth Observer',
        code: 'ISRO-EOS-07',
        rocket: 'SSLV-D2',
        reward: 500,
        timeLimit: 65,
        badge: '🌍 EARTH OBSERVER',
        desc: 'Build an Earth observation satellite for disaster & land mapping',
        required: ['chassis', 'solar', 'obc', 'imager', 'antenna']
    },
    {
        id: 'oceansat',
        name: 'Oceansat-3 Sentinel',
        code: 'ISRO-EOS-06',
        rocket: 'PSLV-C54',
        reward: 650,
        timeLimit: 75,
        badge: '🌊 OCEAN WATCH',
        desc: 'Assemble marine ecosystem radar monitor with thermal battery',
        required: ['chassis', 'solar', 'battery', 'sar', 'obc']
    },
    {
        id: 'astrosat',
        name: 'Astrosat Explorer',
        code: 'ISRO-ASTRO',
        rocket: 'PSLV-C30',
        reward: 800,
        timeLimit: 85,
        badge: '✨ ASTRO OBSERVATORY',
        desc: 'Deep space UV & X-ray telescope satellite with high precision ADCS',
        required: ['chassis', 'solar', 'obc', 'adcs', 'imager', 'antenna']
    },
    {
        id: 'aditya',
        name: 'Aditya-L1 Companion',
        code: 'ISRO-SOLAR-L1',
        rocket: 'PSLV-C57',
        reward: 950,
        timeLimit: 90,
        badge: '☀️ SOLAR PROBE',
        desc: 'Sun-Earth L1 solar radiation & vector magnetometer CubeSat',
        required: ['chassis', 'solar', 'battery', 'obc', 'magnetometer']
    },
    {
        id: 'chandrayaan',
        name: 'Chandrayaan Prospector',
        code: 'ISRO-LUNAR-03',
        rocket: 'LVM3-M4',
        reward: 1100,
        timeLimit: 95,
        badge: '🌕 LUNAR EXPLORER',
        desc: 'Lunar polar water-ice & mineral spectrometer satellite',
        required: ['chassis', 'solar', 'battery', 'spectrometer', 'thruster', 'antenna']
    },
    {
        id: 'mangalyaan',
        name: 'Mangalyaan-2 Deep Space',
        code: 'ISRO-MOM-02',
        rocket: 'LVM3-MARS',
        reward: 1300,
        timeLimit: 100,
        badge: '🔴 MARS ORBITER',
        desc: 'Martian atmospheric methane sensor with deep space thrusters',
        required: ['chassis', 'solar', 'spectrometer', 'adcs', 'antenna', 'thruster']
    }
];

const ISRO_FACILITIES = [
    {
        id: 'ursc',
        name: 'U R Rao Satellite Centre (URSC)',
        city: 'Bengaluru, Karnataka',
        desc: 'Lead center for design and development of Indian satellites.',
        timeMultiplier: 1.0,
        bgTheme: '#0F172A'
    },
    {
        id: 'sac',
        name: 'Space Applications Centre (SAC)',
        city: 'Ahmedabad, Gujarat',
        desc: 'Development of space-borne sensors and communication payloads.',
        timeMultiplier: 0.9,
        bgTheme: '#030712'
    },
    {
        id: 'sdsc',
        name: 'Satish Dhawan Space Centre (SDSC SHAR)',
        city: 'Sriharikota, Andhra Pradesh',
        desc: 'India’s spaceport for final satellite integration and rocket launch.',
        timeMultiplier: 0.8,
        bgTheme: '#090D16'
    }
];
