// TrustBites Price Range Utilities
// Shared utility functions for handling restaurant price information

export interface PriceRange {
  level: number | null;
  symbol: string;
  description: string;
  range: string;
  color?: string; // For UI styling
}

/**
 * Convert Google's price_level (0-4) to user-friendly format
 * @param priceLevel - Google Places API price_level (0-4)
 * @returns Formatted price range information
 */
export function formatPriceRange(priceLevel: number | undefined): PriceRange {
  if (priceLevel === undefined || priceLevel === null) {
    return {
      level: null,
      symbol: '?',
      description: 'Price not available',
      range: 'Unknown',
      color: '#6B7280' // Gray
    };
  }

  const priceMap = {
    0: { 
      symbol: 'FREE', 
      description: 'Free or very cheap', 
      range: 'Under RM10',
      color: '#10B981' // Green
    },
    1: { 
      symbol: '$', 
      description: 'Inexpensive', 
      range: 'RM10-25',
      color: '#059669' // Green
    },
    2: { 
      symbol: '$$', 
      description: 'Moderate', 
      range: 'RM25-60',
      color: '#D97706' // Orange
    },
    3: { 
      symbol: '$$$', 
      description: 'Expensive', 
      range: 'RM60-120',
      color: '#DC2626' // Red
    },
    4: { 
      symbol: '$$$$', 
      description: 'Very expensive', 
      range: 'RM120+',
      color: '#7C2D12' // Dark red
    }
  };

  const priceInfo = priceMap[priceLevel as keyof typeof priceMap] || priceMap[1];
  
  return {
    level: priceLevel,
    symbol: priceInfo.symbol,
    description: priceInfo.description,
    range: priceInfo.range,
    color: priceInfo.color
  };
}

/**
 * Get price filter options for frontend filtering
 * @returns Array of price filter options
 */
export function getPriceFilterOptions() {
  return [
    { value: 'all', label: 'All Prices', symbol: '' },
    { value: '0', label: 'Free/Very Cheap', symbol: 'FREE', range: 'Under RM10' },
    { value: '1', label: 'Inexpensive', symbol: '$', range: 'RM10-25' },
    { value: '2', label: 'Moderate', symbol: '$$', range: 'RM25-60' },
    { value: '3', label: 'Expensive', symbol: '$$$', range: 'RM60-120' },
    { value: '4', label: 'Very Expensive', symbol: '$$$$', range: 'RM120+' }
  ];
}

/**
 * Filter restaurants by price level
 * @param restaurants - Array of restaurants
 * @param maxPriceLevel - Maximum price level to include (0-4)
 * @returns Filtered restaurants
 */
export function filterByPriceLevel(restaurants: any[], maxPriceLevel: number | string) {
  if (maxPriceLevel === 'all' || maxPriceLevel === '') {
    return restaurants;
  }
  
  const maxLevel = typeof maxPriceLevel === 'string' ? parseInt(maxPriceLevel) : maxPriceLevel;
  
  return restaurants.filter(restaurant => {
    if (restaurant.priceLevel === undefined || restaurant.priceLevel === null) {
      return true; // Include restaurants with unknown price
    }
    return restaurant.priceLevel <= maxLevel;
  });
}

/**
 * Get price range statistics for a list of restaurants
 * @param restaurants - Array of restaurants
 * @returns Price distribution statistics
 */
export function getPriceDistribution(restaurants: any[]) {
  const distribution = {
    0: { count: 0, percentage: 0, label: 'Free/Very Cheap' },
    1: { count: 0, percentage: 0, label: 'Inexpensive' },
    2: { count: 0, percentage: 0, label: 'Moderate' },
    3: { count: 0, percentage: 0, label: 'Expensive' },
    4: { count: 0, percentage: 0, label: 'Very Expensive' },
    unknown: { count: 0, percentage: 0, label: 'Unknown' }
  };

  const total = restaurants.length;

  restaurants.forEach(restaurant => {
    const level = restaurant.priceLevel;
    if (level !== undefined && level !== null && level >= 0 && level <= 4) {
      distribution[level as keyof typeof distribution].count++;
    } else {
      distribution.unknown.count++;
    }
  });

  // Calculate percentages
  Object.keys(distribution).forEach(key => {
    const dist = distribution[key as keyof typeof distribution];
    dist.percentage = total > 0 ? Math.round((dist.count / total) * 100) : 0;
  });

  return distribution;
}

/**
 * Get average price level for a list of restaurants
 * @param restaurants - Array of restaurants
 * @returns Average price level and formatted description
 */
export function getAveragePriceLevel(restaurants: any[]) {
  const validPrices = restaurants
    .map(r => r.priceLevel)
    .filter(p => p !== undefined && p !== null && p >= 0 && p <= 4);

  if (validPrices.length === 0) {
    return {
      average: null,
      description: 'Price information not available',
      symbol: '?'
    };
  }

  const average = validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;
  const roundedAverage = Math.round(average);
  const priceInfo = formatPriceRange(roundedAverage);

  return {
    average: parseFloat(average.toFixed(1)),
    description: priceInfo.description,
    symbol: priceInfo.symbol,
    range: priceInfo.range
  };
}