import { SalesRecord } from '../types/sales';

export interface SamplePreset {
  id: string;
  name: string;
  description: string;
  highlight: string;
  data: Omit<SalesRecord, 'id'>[];
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'enterprise-tech',
    name: 'Enterprise Cloud & Tech Hardware',
    description: 'B2B enterprise transactions across global territories with distinct Q2 to Q3 swings.',
    highlight: 'Asia-Pacific undergoes the largest Q2 to Q3 decline due to Cloud Server hardware shipment constraints.',
    data: [
      // Asia-Pacific Q1-Q4
      { quarter: 'Q1', region: 'Asia-Pacific', channel: 'Direct Sales', product: 'Cloud Server Blade', units: 310, discount_pct: 12.0, revenue: 1240000 },
      { quarter: 'Q1', region: 'Asia-Pacific', channel: 'Partner Network', product: 'Security Gateway', units: 450, discount_pct: 8.5, revenue: 675000 },
      { quarter: 'Q1', region: 'Asia-Pacific', channel: 'Online Portal', product: 'Analytics Suite', units: 620, discount_pct: 5.0, revenue: 310000 },

      { quarter: 'Q2', region: 'Asia-Pacific', channel: 'Direct Sales', product: 'Cloud Server Blade', units: 480, discount_pct: 10.0, revenue: 1920000 },
      { quarter: 'Q2', region: 'Asia-Pacific', channel: 'Partner Network', product: 'Security Gateway', units: 520, discount_pct: 12.0, revenue: 780000 },
      { quarter: 'Q2', region: 'Asia-Pacific', channel: 'Online Portal', product: 'Analytics Suite', units: 800, discount_pct: 7.0, revenue: 400000 },

      { quarter: 'Q3', region: 'Asia-Pacific', channel: 'Direct Sales', product: 'Cloud Server Blade', units: 210, discount_pct: 16.5, revenue: 840000 },
      { quarter: 'Q3', region: 'Asia-Pacific', channel: 'Partner Network', product: 'Security Gateway', units: 340, discount_pct: 18.0, revenue: 510000 },
      { quarter: 'Q3', region: 'Asia-Pacific', channel: 'Online Portal', product: 'Analytics Suite', units: 580, discount_pct: 10.0, revenue: 290000 },

      { quarter: 'Q4', region: 'Asia-Pacific', channel: 'Direct Sales', product: 'Cloud Server Blade', units: 420, discount_pct: 11.0, revenue: 1680000 },
      { quarter: 'Q4', region: 'Asia-Pacific', channel: 'Partner Network', product: 'Security Gateway', units: 610, discount_pct: 9.0, revenue: 915000 },
      { quarter: 'Q4', region: 'Asia-Pacific', channel: 'Online Portal', product: 'Analytics Suite', units: 950, discount_pct: 6.0, revenue: 475000 },

      // North America Q1-Q4
      { quarter: 'Q1', region: 'North America', channel: 'Direct Sales', product: 'Cloud Server Blade', units: 550, discount_pct: 8.0, revenue: 2200000 },
      { quarter: 'Q1', region: 'North America', channel: 'Partner Network', product: 'Security Gateway', units: 720, discount_pct: 6.0, revenue: 1080000 },
      { quarter: 'Q1', region: 'North America', channel: 'Online Portal', product: 'Analytics Suite', units: 1200, discount_pct: 4.0, revenue: 600000 },

      { quarter: 'Q2', region: 'North America', channel: 'Direct Sales', product: 'Cloud Server Blade', units: 610, discount_pct: 7.5, revenue: 2440000 },
      { quarter: 'Q2', region: 'North America', channel: 'Partner Network', product: 'Security Gateway', units: 830, discount_pct: 5.5, revenue: 1245000 },
      { quarter: 'Q2', region: 'North America', channel: 'Online Portal', product: 'Analytics Suite', units: 1450, discount_pct: 3.5, revenue: 725000 },

      { quarter: 'Q3', region: 'North America', channel: 'Direct Sales', product: 'Cloud Server Blade', units: 680, discount_pct: 7.0, revenue: 2720000 },
      { quarter: 'Q3', region: 'North America', channel: 'Partner Network', product: 'Security Gateway', units: 910, discount_pct: 5.0, revenue: 1365000 },
      { quarter: 'Q3', region: 'North America', channel: 'Online Portal', product: 'Analytics Suite', units: 1620, discount_pct: 3.0, revenue: 810000 },

      { quarter: 'Q4', region: 'North America', channel: 'Direct Sales', product: 'Cloud Server Blade', units: 820, discount_pct: 6.0, revenue: 3280000 },
      { quarter: 'Q4', region: 'North America', channel: 'Partner Network', product: 'Security Gateway', units: 1100, discount_pct: 4.5, revenue: 1650000 },
      { quarter: 'Q4', region: 'North America', channel: 'Online Portal', product: 'Analytics Suite', units: 1950, discount_pct: 2.5, revenue: 975000 },

      // Europe Q1-Q4
      { quarter: 'Q1', region: 'Europe', channel: 'Direct Sales', product: 'Cloud Server Blade', units: 380, discount_pct: 9.0, revenue: 1520000 },
      { quarter: 'Q1', region: 'Europe', channel: 'Partner Network', product: 'Security Gateway', units: 480, discount_pct: 7.0, revenue: 720000 },
      { quarter: 'Q1', region: 'Europe', channel: 'Online Portal', product: 'Analytics Suite', units: 750, discount_pct: 5.0, revenue: 375000 },

      { quarter: 'Q2', region: 'Europe', channel: 'Direct Sales', product: 'Cloud Server Blade', units: 420, discount_pct: 8.5, revenue: 1680000 },
      { quarter: 'Q2', region: 'Europe', channel: 'Partner Network', product: 'Security Gateway', units: 540, discount_pct: 6.5, revenue: 810000 },
      { quarter: 'Q2', region: 'Europe', channel: 'Online Portal', product: 'Analytics Suite', units: 820, discount_pct: 4.5, revenue: 410000 },

      { quarter: 'Q3', region: 'Europe', channel: 'Direct Sales', product: 'Cloud Server Blade', units: 460, discount_pct: 8.0, revenue: 1840000 },
      { quarter: 'Q3', region: 'Europe', channel: 'Partner Network', product: 'Security Gateway', units: 590, discount_pct: 6.0, revenue: 885000 },
      { quarter: 'Q3', region: 'Europe', channel: 'Online Portal', product: 'Analytics Suite', units: 910, discount_pct: 4.0, revenue: 455000 },

      { quarter: 'Q4', region: 'Europe', channel: 'Direct Sales', product: 'Cloud Server Blade', units: 530, discount_pct: 7.5, revenue: 2120000 },
      { quarter: 'Q4', region: 'Europe', channel: 'Partner Network', product: 'Security Gateway', units: 680, discount_pct: 5.5, revenue: 1020000 },
      { quarter: 'Q4', region: 'Europe', channel: 'Online Portal', product: 'Analytics Suite', units: 1050, discount_pct: 3.5, revenue: 525000 },

      // Latin America Q1-Q4
      { quarter: 'Q1', region: 'Latin America', channel: 'Direct Sales', product: 'Cloud Server Blade', units: 120, discount_pct: 15.0, revenue: 480000 },
      { quarter: 'Q1', region: 'Latin America', channel: 'Partner Network', product: 'Security Gateway', units: 190, discount_pct: 14.0, revenue: 285000 },
      { quarter: 'Q1', region: 'Latin America', channel: 'Online Portal', product: 'Analytics Suite', units: 280, discount_pct: 10.0, revenue: 140000 },

      { quarter: 'Q2', region: 'Latin America', channel: 'Direct Sales', product: 'Cloud Server Blade', units: 150, discount_pct: 14.0, revenue: 600000 },
      { quarter: 'Q2', region: 'Latin America', channel: 'Partner Network', product: 'Security Gateway', units: 230, discount_pct: 12.0, revenue: 345000 },
      { quarter: 'Q2', region: 'Latin America', channel: 'Online Portal', product: 'Analytics Suite', units: 340, discount_pct: 9.0, revenue: 170000 },

      { quarter: 'Q3', region: 'Latin America', channel: 'Direct Sales', product: 'Cloud Server Blade', units: 175, discount_pct: 13.0, revenue: 700000 },
      { quarter: 'Q3', region: 'Latin America', channel: 'Partner Network', product: 'Security Gateway', units: 270, discount_pct: 11.0, revenue: 405000 },
      { quarter: 'Q3', region: 'Latin America', channel: 'Online Portal', product: 'Analytics Suite', units: 410, discount_pct: 8.0, revenue: 205000 },

      { quarter: 'Q4', region: 'Latin America', channel: 'Direct Sales', product: 'Cloud Server Blade', units: 210, discount_pct: 12.0, revenue: 840000 },
      { quarter: 'Q4', region: 'Latin America', channel: 'Partner Network', product: 'Security Gateway', units: 330, discount_pct: 10.0, revenue: 495000 },
      { quarter: 'Q4', region: 'Latin America', channel: 'Online Portal', product: 'Analytics Suite', units: 520, discount_pct: 7.0, revenue: 260000 },
    ],
  },
  {
    id: 'smart-hardware',
    name: 'Smart Devices & Consumer Audio',
    description: 'Consumer tech accessories across omni-channel retail networks.',
    highlight: 'Europe surges substantially in Q3 propelled by audio wearable summer campaigns.',
    data: [
      // Europe
      { quarter: 'Q1', region: 'Europe', channel: 'Retail Store', product: 'Acoustic Pro Headphone', units: 2200, discount_pct: 5.0, revenue: 440000 },
      { quarter: 'Q1', region: 'Europe', channel: 'E-Commerce', product: 'Wireless Audio Bar', units: 1400, discount_pct: 8.0, revenue: 280000 },
      { quarter: 'Q1', region: 'Europe', channel: 'Wholesale', product: 'Smart Sound Hub', units: 950, discount_pct: 12.0, revenue: 190000 },

      { quarter: 'Q2', region: 'Europe', channel: 'Retail Store', product: 'Acoustic Pro Headphone', units: 2400, discount_pct: 6.0, revenue: 480000 },
      { quarter: 'Q2', region: 'Europe', channel: 'E-Commerce', product: 'Wireless Audio Bar', units: 1600, discount_pct: 7.5, revenue: 320000 },
      { quarter: 'Q2', region: 'Europe', channel: 'Wholesale', product: 'Smart Sound Hub', units: 1100, discount_pct: 11.0, revenue: 220000 },

      { quarter: 'Q3', region: 'Europe', channel: 'Retail Store', product: 'Acoustic Pro Headphone', units: 5800, discount_pct: 14.0, revenue: 1160000 },
      { quarter: 'Q3', region: 'Europe', channel: 'E-Commerce', product: 'Wireless Audio Bar', units: 4100, discount_pct: 10.0, revenue: 820000 },
      { quarter: 'Q3', region: 'Europe', channel: 'Wholesale', product: 'Smart Sound Hub', units: 2600, discount_pct: 15.0, revenue: 520000 },

      { quarter: 'Q4', region: 'Europe', channel: 'Retail Store', product: 'Acoustic Pro Headphone', units: 6400, discount_pct: 12.0, revenue: 1280000 },
      { quarter: 'Q4', region: 'Europe', channel: 'E-Commerce', product: 'Wireless Audio Bar', units: 4900, discount_pct: 9.0, revenue: 980000 },
      { quarter: 'Q4', region: 'Europe', channel: 'Wholesale', product: 'Smart Sound Hub', units: 3100, discount_pct: 14.0, revenue: 620000 },

      // North America
      { quarter: 'Q1', region: 'North America', channel: 'Retail Store', product: 'Acoustic Pro Headphone', units: 4500, discount_pct: 6.0, revenue: 900000 },
      { quarter: 'Q1', region: 'North America', channel: 'E-Commerce', product: 'Wireless Audio Bar', units: 3800, discount_pct: 7.0, revenue: 760000 },
      { quarter: 'Q1', region: 'North America', channel: 'Wholesale', product: 'Smart Sound Hub', units: 2400, discount_pct: 10.0, revenue: 480000 },

      { quarter: 'Q2', region: 'North America', channel: 'Retail Store', product: 'Acoustic Pro Headphone', units: 4800, discount_pct: 5.5, revenue: 960000 },
      { quarter: 'Q2', region: 'North America', channel: 'E-Commerce', product: 'Wireless Audio Bar', units: 4200, discount_pct: 6.5, revenue: 840000 },
      { quarter: 'Q2', region: 'North America', channel: 'Wholesale', product: 'Smart Sound Hub', units: 2700, discount_pct: 9.0, revenue: 540000 },

      { quarter: 'Q3', region: 'North America', channel: 'Retail Store', product: 'Acoustic Pro Headphone', units: 5100, discount_pct: 6.0, revenue: 1020000 },
      { quarter: 'Q3', region: 'North America', channel: 'E-Commerce', product: 'Wireless Audio Bar', units: 4400, discount_pct: 7.0, revenue: 880000 },
      { quarter: 'Q3', region: 'North America', channel: 'Wholesale', product: 'Smart Sound Hub', units: 2900, discount_pct: 9.5, revenue: 580000 },

      { quarter: 'Q4', region: 'North America', channel: 'Retail Store', product: 'Acoustic Pro Headphone', units: 7200, discount_pct: 11.0, revenue: 1440000 },
      { quarter: 'Q4', region: 'North America', channel: 'E-Commerce', product: 'Wireless Audio Bar', units: 6500, discount_pct: 12.0, revenue: 1300000 },
      { quarter: 'Q4', region: 'North America', channel: 'Wholesale', product: 'Smart Sound Hub', units: 4200, discount_pct: 14.0, revenue: 840000 },
    ],
  },
  {
    id: 'mixed-casing-dataset',
    name: 'Mixed Casing Regions (West & west)',
    description: 'Demonstrates automated unification of "West", "west", "East", and "east" data rows.',
    highlight: 'Seamlessly merges "west" and "West" rows into a unified West territory with integrated revenue.',
    data: [
      // West & west
      { quarter: 'Q1', region: 'West', channel: 'Direct Sales', product: 'Enterprise Hub', units: 350, discount_pct: 5.0, revenue: 700000 },
      { quarter: 'Q1', region: 'west', channel: 'E-Commerce', product: 'Cloud Gateway', units: 280, discount_pct: 8.0, revenue: 560000 },
      { quarter: 'Q2', region: 'West', channel: 'Direct Sales', product: 'Enterprise Hub', units: 420, discount_pct: 6.0, revenue: 840000 },
      { quarter: 'Q2', region: 'west', channel: 'E-Commerce', product: 'Cloud Gateway', units: 310, discount_pct: 7.0, revenue: 620000 },
      { quarter: 'Q3', region: 'West', channel: 'Direct Sales', product: 'Enterprise Hub', units: 890, discount_pct: 12.0, revenue: 1780000 },
      { quarter: 'Q3', region: 'west', channel: 'E-Commerce', product: 'Cloud Gateway', units: 640, discount_pct: 10.0, revenue: 1280000 },
      { quarter: 'Q4', region: 'West', channel: 'Direct Sales', product: 'Enterprise Hub', units: 950, discount_pct: 11.0, revenue: 1900000 },
      { quarter: 'Q4', region: 'west', channel: 'E-Commerce', product: 'Cloud Gateway', units: 720, discount_pct: 9.0, revenue: 1440000 },

      // East & east
      { quarter: 'Q1', region: 'East', channel: 'Direct Sales', product: 'Enterprise Hub', units: 400, discount_pct: 6.0, revenue: 800000 },
      { quarter: 'Q1', region: 'east', channel: 'E-Commerce', product: 'Cloud Gateway', units: 300, discount_pct: 7.0, revenue: 600000 },
      { quarter: 'Q2', region: 'East', channel: 'Direct Sales', product: 'Enterprise Hub', units: 450, discount_pct: 5.5, revenue: 900000 },
      { quarter: 'Q2', region: 'east', channel: 'E-Commerce', product: 'Cloud Gateway', units: 330, discount_pct: 6.5, revenue: 660000 },
      { quarter: 'Q3', region: 'East', channel: 'Direct Sales', product: 'Enterprise Hub', units: 490, discount_pct: 6.0, revenue: 980000 },
      { quarter: 'Q3', region: 'east', channel: 'E-Commerce', product: 'Cloud Gateway', units: 350, discount_pct: 7.0, revenue: 700000 },
      { quarter: 'Q4', region: 'East', channel: 'Direct Sales', product: 'Enterprise Hub', units: 580, discount_pct: 5.0, revenue: 1160000 },
      { quarter: 'Q4', region: 'east', channel: 'E-Commerce', product: 'Cloud Gateway', units: 410, discount_pct: 6.0, revenue: 820000 },

      // Central
      { quarter: 'Q1', region: 'Central', channel: 'Direct Sales', product: 'Enterprise Hub', units: 250, discount_pct: 7.0, revenue: 500000 },
      { quarter: 'Q2', region: 'central', channel: 'Direct Sales', product: 'Enterprise Hub', units: 290, discount_pct: 6.0, revenue: 580000 },
      { quarter: 'Q3', region: 'Central', channel: 'Direct Sales', product: 'Enterprise Hub', units: 340, discount_pct: 7.5, revenue: 680000 },
      { quarter: 'Q4', region: 'central', channel: 'Direct Sales', product: 'Enterprise Hub', units: 380, discount_pct: 6.5, revenue: 760000 },
    ],
  },
];

export function getSampleCSVText(): string {
  const sample = SAMPLE_PRESETS[0];
  const headers = 'quarter,region,channel,product,units,discount_pct,revenue';
  const rows = sample.data.map(
    d => `${d.quarter},${d.region},${d.channel},${d.product},${d.units},${d.discount_pct},${d.revenue}`
  );
  return [headers, ...rows].join('\n');
}
