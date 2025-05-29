import moment from 'moment';

export interface MeterReading {
  meterId: string;
  timestamp: string;
  parameterName: string;
  obisCode: string;
  value: number;
  unit: string;
}

class DataCollectionService {
  private static instance: DataCollectionService;
  private collectionIntervals: NodeJS.Timeout[] = [];

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): DataCollectionService {
    if (!DataCollectionService.instance) {
      DataCollectionService.instance = new DataCollectionService();
    }
    return DataCollectionService.instance;
  }

  public startDataCollection(meterIds: string[]) {
    // Schedule daily collection at midnight
    this.scheduleDailyCollection(meterIds);
    
    // Schedule block load profile collection (every 30 minutes)
    this.scheduleBlockCollection(meterIds);
    
    // Schedule monthly billing data collection
    this.scheduleMonthlyCollection(meterIds);
    
    // Start instantaneous data collection (every 5 minutes)
    this.scheduleInstantaneousCollection(meterIds);
  }

  private scheduleDailyCollection(meterIds: string[]) {
    // Calculate time until next midnight
    const now = moment();
    const nextMidnight = moment().add(1, 'day').startOf('day');
    const msUntilMidnight = nextMidnight.diff(now);

    // Schedule first collection at next midnight
    setTimeout(() => {
      this.collectDailyData(meterIds);
      
      // Then schedule recurring collection every 24 hours
      const interval = setInterval(() => {
        this.collectDailyData(meterIds);
      }, 24 * 60 * 60 * 1000);
      
      this.collectionIntervals.push(interval);
    }, msUntilMidnight);
  }

  private scheduleBlockCollection(meterIds: string[]) {
    const interval = setInterval(() => {
      this.collectBlockData(meterIds);
    }, 30 * 60 * 1000); // Every 30 minutes
    
    this.collectionIntervals.push(interval);
  }

  private scheduleMonthlyCollection(meterIds: string[]) {
    // Calculate time until first day of next month
    const now = moment();
    const nextMonth = moment().add(1, 'month').startOf('month');
    const msUntilNextMonth = nextMonth.diff(now);

    // Schedule first collection at start of next month
    setTimeout(() => {
      this.collectBillingData(meterIds);
      
      // Then schedule recurring collection monthly
      const interval = setInterval(() => {
        this.collectBillingData(meterIds);
      }, 30 * 24 * 60 * 60 * 1000); // Approximately monthly
      
      this.collectionIntervals.push(interval);
    }, msUntilNextMonth);
  }

  private scheduleInstantaneousCollection(meterIds: string[]) {
    const interval = setInterval(() => {
      this.collectInstantaneousData(meterIds);
    }, 5 * 60 * 1000); // Every 5 minutes
    
    this.collectionIntervals.push(interval);
  }

  private async collectDailyData(meterIds: string[]) {
    try {
      console.log('Collecting daily data at:', new Date().toISOString());
      // In real implementation, this would:
      // 1. Connect to each meter
      // 2. Read daily profile OBIS codes
      // 3. Store the data
      // 4. Handle any communication errors
    } catch (error) {
      console.error('Error collecting daily data:', error);
    }
  }

  private async collectBlockData(meterIds: string[]) {
    try {
      console.log('Collecting block load profile data at:', new Date().toISOString());
      // Implementation for block load profile collection
    } catch (error) {
      console.error('Error collecting block data:', error);
    }
  }

  private async collectBillingData(meterIds: string[]) {
    try {
      console.log('Collecting monthly billing data at:', new Date().toISOString());
      // Implementation for monthly billing data collection
    } catch (error) {
      console.error('Error collecting billing data:', error);
    }
  }

  private async collectInstantaneousData(meterIds: string[]) {
    try {
      console.log('Collecting instantaneous data at:', new Date().toISOString());
      // Implementation for instantaneous data collection
    } catch (error) {
      console.error('Error collecting instantaneous data:', error);
    }
  }

  public stopDataCollection() {
    // Clear all collection intervals
    this.collectionIntervals.forEach(interval => clearInterval(interval));
    this.collectionIntervals = [];
  }
}

export default DataCollectionService; 