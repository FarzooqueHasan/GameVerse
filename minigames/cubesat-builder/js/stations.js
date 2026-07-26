// ISRO Cleanroom Stations and Map Builder

class CleanroomMap {
    constructor() {
        this.cols = 16;
        this.rows = 10;
        this.tileSize = 48; // Grid tile size in canvas pixels
        this.grid = [];
        this.initGrid();
    }

    initGrid() {
        // Create grid array initialized to floor
        this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null).map(() => ({
            type: 'FLOOR',
            station: null,
            item: null
        })));

        // Define Cleanroom Layout matching NASA / ISRO satellite integration facility
        // Top Wall Workbenches (Soldering & Supply Bins)
        this.setStation(1, 0, 'CRATE', { component: 'chassis', label: 'Chassis' });
        this.setStation(2, 0, 'CRATE', { component: 'solar', label: 'Solar' });
        this.setStation(3, 0, 'CRATE', { component: 'battery', label: 'Battery' });
        this.setStation(4, 0, 'CRATE', { component: 'obc', label: 'OBC' });
        this.setStation(5, 0, 'CRATE', { component: 'imager', label: 'Imager' });
        this.setStation(6, 0, 'CRATE', { component: 'sar', label: 'SAR Radar' });
        this.setStation(7, 0, 'CRATE', { component: 'spectrometer', label: 'Spectro' });
        this.setStation(8, 0, 'CRATE', { component: 'magnetometer', label: 'Mag' });
        this.setStation(9, 0, 'CRATE', { component: 'adcs', label: 'ADCS' });
        this.setStation(10, 0, 'CRATE', { component: 'antenna', label: 'Antenna' });
        this.setStation(11, 0, 'CRATE', { component: 'thruster', label: 'Thruster' });

        // Left Side Assembly Benches & Soldering
        this.setStation(0, 2, 'BENCH', { name: 'Assembly Bench A' });
        this.setStation(0, 3, 'BENCH', { name: 'Assembly Bench B' });
        this.setStation(0, 4, 'BENCH', { name: 'Assembly Bench C' });
        this.setStation(0, 6, 'SOLDER', { name: 'Wiring & Solder Desk', progress: 0, maxProgress: 100 });
        this.setStation(0, 7, 'SOLDER', { name: 'Wiring & Solder Desk B', progress: 0, maxProgress: 100 });

        // Center Island Benches
        this.setStation(5, 4, 'BENCH', { name: 'Prep Bench 1' });
        this.setStation(6, 4, 'BENCH', { name: 'Prep Bench 2' });
        this.setStation(7, 4, 'BENCH', { name: 'Prep Bench 3' });
        this.setStation(8, 4, 'BENCH', { name: 'Prep Bench 4' });
        this.setStation(9, 4, 'BENCH', { name: 'Prep Bench 5' });

        // Bottom Right Thermal Vacuum Testing Chambers (TVAC)
        this.setStation(12, 8, 'TVAC', { name: 'TVAC Chamber 1', status: 'IDLE', timer: 0, duration: 4.0 });
        this.setStation(14, 8, 'TVAC', { name: 'TVAC Chamber 2', status: 'IDLE', timer: 0, duration: 4.0 });

        // Right Side Delivery Conveyor & Trash Bin
        this.setStation(15, 2, 'DELIVERY', { name: 'ISRO Launch Delivery' });
        this.setStation(15, 3, 'DELIVERY', { name: 'ISRO Launch Delivery' });
        this.setStation(15, 5, 'TRASH', { name: 'Recycle Trash Bin' });
    }

    setStation(col, row, type, props = {}) {
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            this.grid[row][col] = {
                type: type,
                station: props,
                item: null
            };
        }
    }

    isSolid(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return true;
        const cell = this.grid[row][col];
        return cell.type !== 'FLOOR';
    }

    getCell(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return null;
        return this.grid[row][col];
    }
}
